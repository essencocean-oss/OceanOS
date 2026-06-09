import { exec } from "node:child_process";
import { promisify } from "node:util";

const execAsync = promisify(exec);

export interface AppContainerOptions {
  name: string;
}

export interface RuleMeta {
  name: string;
  created: number;
  process: string;
  kind: "allow" | "block";
  network: boolean;
}

export class WindowsSecurityAdapter {
  private readonly rules: Map<string, RuleMeta> = new Map();

  async isDefenderSmartAppControlEnabled(): Promise<boolean> {
    try {
      const { stdout } = await execAsync(
        "powershell -Command \"Get-MpComputerStatus | Select-Object -ExpandProperty IsSmartAppControlEnabled\"",
      );
      return stdout.trim().toLowerCase() === "true";
    } catch {
      return false;
    }
  }

  async isAppLockerEnabled(): Promise<boolean> {
    try {
      const { stdout } = await execAsync(
        "powershell -Command \"(Get-AppLockerPolicy -Effective | Select-Object -ExpandProperty RuleCollections) -ne $null\"",
      );
      return stdout.trim().toLowerCase() === "true";
    } catch {
      return false;
    }
  }

  async createAppContainer(options: AppContainerOptions): Promise<string> {
    const script = `
      $name = "${options.name}"
      try {
        $existing = Get-AppContainer -Name $name -ErrorAction SilentlyContinue
        if ($existing) { return $existing.AppContainerSid }
      } catch {}
      $profile = New-AppContainerProfile -Name $name -PassThru
      return $profile.AppContainerSid
    `;
    try {
      const { stdout } = await execAsync(
        `powershell -Command "${script.replace(/\n/g, "; ")}"`,
      );
      return stdout.trim();
    } catch (err) {
      console.error("Failed to create AppContainer:", err);
      return "";
    }
  }

  async destroyAppContainer(token: string): Promise<void> {
    try {
      await execAsync(
        `powershell -Command "Remove-AppContainer -AppContainerSid ${token} -ErrorAction SilentlyContinue"`,
      );
    } catch {
      // ignore cleanup errors
    }
  }

  async monitorProcessCreate(pid: number): Promise<void> {
    const script = `
      Register-WmiEvent -Class Win32_ProcessStartTrace -SourceIdentifier SentinelProcessStart -Action {
        $p = $Event.SourceEventArgs.NewEvent
        if ($p.ProcessID -eq ${pid}) {
          Write-Output "PROCESS_CREATED: $($p.ProcessName) PID=$($p.ProcessID) PARENT=$($p.ParentProcessID)"
        }
      }
    `;
    try {
      await execAsync(`powershell -Command "${script.replace(/\n/g, "; ")}"`);
    } catch {
      // monitoring is best-effort
    }
  }

  async monitorNetworkAccess(_pid: number): Promise<void> {
    // Placeholder: would require Windows Filtering Platform or netsh hook
    console.log(`[Sentinel] Network monitoring requested for PID ${_pid}`);
  }

  async monitorFileWrite(path: string): Promise<void> {
    try {
      const escaped = path.replace(/\\/g, "\\\\");
      await execAsync(
        `powershell -Command "Register-ObjectEvent -InputObject (New-Object System.IO.FileSystemWatcher '$(dirname \"${path}\" || dirname \"${path}\")') -EventName Changed -Action { if ($_.EventArgs.FullPath -eq '${escaped}') { Write-Output 'FILE_WRITE' } }"`,
      );
    } catch {
      // file monitoring is best-effort
    }
  }

  async blockProcess(network: boolean, process: string, ttlMs?: number): Promise<string> {
    const ruleName = `Sentinel_Block_${process}`;
    try {
      if (network) {
        await execAsync(
          `netsh advfirewall firewall add rule name="${ruleName}" dir=out program="%SystemRoot%\\System32\\${process}.exe" action=block`,
        );
      } else {
        await execAsync(
          `powershell -Command "Set-MpPreference -ExclusionProcess '${process}'"`,
        );
      }
    } catch (err) {
      console.error("Failed to apply block rule:", err);
      return "";
    }

    const meta: RuleMeta = {
      name: ruleName,
      created: Date.now(),
      process,
      kind: "block",
      network,
    };
    if (typeof ttlMs === "number" && Number.isFinite(ttlMs) && ttlMs > 0) {
      meta.created = Date.now(); // creation timestamp is already set above
      // store ttl implicitly via created time; caller uses expireRules
    }
    this.rules.set(ruleName, meta);
    return ruleName;
  }

  async allowProcess(network: boolean, process: string, ttlMs?: number): Promise<string> {
    const ruleName = `Sentinel_Allow_${process}`;
    try {
      if (network) {
        await execAsync(
          `netsh advfirewall firewall add rule name="${ruleName}" dir=out program="%SystemRoot%\\System32\\${process}.exe" action=allow`,
        );
      } else {
        await execAsync(
          `powershell -Command "Remove-MpPreference -ExclusionProcess '${process}' -ErrorAction SilentlyContinue"`,
        );
      }
    } catch {
      // best-effort
    }

    const meta: RuleMeta = {
      name: ruleName,
      created: Date.now(),
      process,
      kind: "allow",
      network,
    };
    this.rules.set(ruleName, meta);
    return ruleName;
  }

  async removeRuleByName(ruleName: string): Promise<boolean> {
    try {
      const { stdout } = await execAsync(
        `netsh advfirewall firewall show rule name="${ruleName}"`
      );
      if (!stdout.includes(ruleName)) {
        return false;
      }
    } catch {
      return false;
    }
    try {
      await execAsync(
        `netsh advfirewall firewall delete rule name="${ruleName}"`
      );
    } catch (err) {
      console.error("Failed to delete rule:", err);
      return false;
    }
    this.rules.delete(ruleName);
    return true;
  }

  async expireRules(maxAgeMs: number): Promise<string[]> {
    const now = Date.now();
    const expired: string[] = [];
    for (const [name, meta] of this.rules.entries()) {
      if (now - meta.created >= maxAgeMs) {
        const removed = await this.removeRuleByName(name);
        if (removed) {
          expired.push(name);
        }
      }
    }
    return expired;
  }

  async cleanupAllSentinelRules(): Promise<number> {
    const all = Array.from(this.rules.keys());
    let cleaned = 0;
    for (const name of all) {
      const ok = await this.removeRuleByName(name);
      if (ok) cleaned++;
    }
    return cleaned;
  }

  async isolateInAppContainer(pid: number): Promise<string> {
    try {
      const containerName = `Sentinel_Isolated_${pid}_${Date.now()}`;
      const token = await this.createAppContainer({ name: containerName });
      await execAsync(
        `powershell -Command "Invoke-Command -ScriptBlock { Start-Process -Id ${pid} -AppContainer $token }"`,
      );
      return token;
    } catch {
      return "";
    }
  }
}

export const windowsAdapter = new WindowsSecurityAdapter();
