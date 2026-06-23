import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";

export interface ManagedProcess {
  id: string;
  label: string;
  command: string;
  args: string[];
  cwd: string;
  pid: number;
  status: "running" | "stopped" | "error";
  startedAt: number;
  exitCode: number | null;
  error: string | null;
}

const registry = new Map<string, ManagedProcess>();

export function startProcess(input: {
  label: string;
  command: string;
  args: string[];
  cwd: string;
}): ManagedProcess {
  const id = randomUUID();
  const child = spawn(input.command, input.args, {
    cwd: input.cwd,
    shell: true,
    windowsHide: true,
  });

  const record: ManagedProcess = {
    id,
    label: input.label,
    command: input.command,
    args: input.args,
    cwd: input.cwd,
    pid: child.pid ?? 0,
    status: "running",
    startedAt: Date.now(),
    exitCode: null,
    error: null,
  };

  if (!child.pid) {
    record.status = "error";
    record.error = "missing pid";
  }

  child.on("error", (err) => {
    record.status = "error";
    record.error = err instanceof Error ? err.message : String(err);
    registry.set(id, { ...record });
  });

  child.on("exit", (code) => {
    record.status = "stopped";
    record.exitCode = typeof code === "number" ? code : code ?? null;
    registry.set(id, { ...record });
  });

  registry.set(id, record);
  return structuredClone(record);
}

export function stopProcess(id: string): boolean {
  const rec = registry.get(id);
  if (!rec || rec.status !== "running") return false;

  try {
    if (rec.pid > 0) process.kill(rec.pid, "SIGTERM");
    return true;
  } catch {
    return false;
  }
}

export function restartProcess(id: string): ManagedProcess | null {
  const rec = registry.get(id);
  if (!rec) return null;
  const stopped = stopProcess(id);

  if (stopped) {
    setTimeout(() => {
      startProcess({
        label: `${rec.label} (restart)`,
        command: rec.command,
        args: rec.args,
        cwd: rec.cwd,
      });
    }, 250);
  }

  return structuredClone(rec);
}

export function listManagedProcesses(): ManagedProcess[] {
  return Array.from(registry.values()).sort(
    (a, b) => b.startedAt - a.startedAt,
  );
}

export function getManagedProcess(id: string): ManagedProcess | undefined {
  return registry.get(id);
}

export function registerProcessIpc(): void {
  const { ipcMain } = require("electron");

  ipcMain.handle(
    "processes:start",
    (_event: unknown, input: {
      label: string;
      command: string;
      args: string[];
      cwd: string;
    }) => startProcess(input),
  );

  ipcMain.handle("processes:kill", (_event: unknown, id: string) =>
    stopProcess(id),
  );

  ipcMain.handle(
    "processes:restart",
    (_event: unknown, id: string) => restartProcess(id),
  );

  ipcMain.handle("processes:list", () => listManagedProcesses());
}
