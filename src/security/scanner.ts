import * as crypto from "node:crypto";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import type { AuditRecord, GuardResult, ScanContext, ScanFinding, WindowsAdapter } from "./types";

const AUDIT_PATH = path.resolve(process.env.OCEANOS_AUDIT ?? "logs/sentinel.audit.jsonl");
let auditReady = false;

function hashFor(content: string): string {
  return crypto.createHash("sha256").update(content).digest("hex");
}

async function ensureAuditDir(): Promise<void> {
  await fs.mkdir(path.dirname(AUDIT_PATH), { recursive: true });
  try {
    await fs.access(AUDIT_PATH);
  } catch {
    await fs.writeFile(AUDIT_PATH, "", "utf-8");
  }
  auditReady = true;
}

function appendAudit(record: AuditRecord): void {
  const line = JSON.stringify(record) + "\n";
  fs.appendFile(AUDIT_PATH, line, "utf-8").catch(() => {});
}

export async function initAudit(): Promise<void> {
  await ensureAuditDir();
}

export async function recordAudit(params: {
  event: string;
  decision: GuardResult["action"];
  findings: ScanFinding[];
  context: ScanContext;
  actor?: string;
  profile?: string;
}): Promise<void> {
  if (!auditReady) await ensureAuditDir();
  const contextStr = JSON.stringify(params.context);
  const record: AuditRecord = {
    ts: new Date().toISOString(),
    event: params.event,
    decision: params.decision,
    findings: params.findings,
    context: params.context,
    actor: params.actor,
    profile: params.profile,
    hashes: {
      context: hashFor(contextStr),
      record: "",
    },
  };
  record.hashes.record = hashFor(JSON.stringify(record));
  appendAudit(record);
}

export function redact(value: unknown): string {
  if (value == null) return String(value);
  const str = String(value);
  if (str.startsWith("-----BEGIN") && str.includes("PRIVATE KEY")) return "[REDACTED:private_key]";
  if (str.startsWith("sk-")) return "[REDACTED:api_key]";
  if (/gh[opupsr]_[A-Za-z0-9_]+/.test(str)) return "[REDACTED:github_token]";
  if (/xox[baprs]-[A-Za-z0-9-]+/.test(str)) return "[REDACTED:slack_token]";
  if (/^password:\s*.+$/i.test(str) || /^passwd:\s*.+$/i.test(str)) return "[REDACTED:password]";
  return str;
}

const TOOLS_ALLOW_LIST = new Set<string>([
  "web_search",
  "web_extract",
  "read_file",
  "terminal",
  "browser_navigate",
]);

export function sha256(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}

export class SentinelScanner {
  constructor(private readonly windows?: WindowsAdapter) {}

  evaluate(ctx: ScanContext): GuardResult {
    const findings: ScanFinding[] = [];
    let action: GuardResult["action"] = "allow";
    const text = JSON.stringify(ctx.payload);

    const looksLikeSecret = (pattern: RegExp, rule: string, title: string): ScanFinding | undefined => {
      if (pattern.test(text)) {
        return {
          id: crypto.randomUUID(),
          ruleId: rule,
          level: "block",
          title,
          detail: "Potential secret or sensitive token detected.",
          action: "redact",
          meta: { kind: ctx.kind, actor: ctx.actor ?? "unknown" },
        };
      }
      return undefined;
    };

    const secrets = looksLikeSecret(/(sk-|-----BEGIN[^\n]+PRIVATE KEY-----|gh[pousr]_[A-Za-z0-9_]+|AKIA[0-9A-Z]{16}|xox[baprs]-[A-Za-z0-9-]+)/, "secret_leak", "Potential secret leak") ?? looksLikeSecret(/(token|secret|password|api_key|apiKey)\s*[:=]\s*[^,"\n]+/i, "sensitive_context_key", "Sensitive context key") ?? undefined;
    if (secrets) {
      findings.push(secrets);
      action = "redact";
    }

    const suspiciousSystemCommands = /(rm\s+-rf|rm\s+-fr|Del\s+\/[sS]|\/F\s+\/[sS]|reg add|reg delete|net\s+user|net\s+localgroup|netsh\s+firewall|shutdown|reboot|format\s+[cCdDeEfF]:|bcdedit)/i;
    if (suspiciousSystemCommands.test(text)) {
      findings.push({ id: crypto.randomUUID(), ruleId: "dangerous_system_cmd", level: "block", title: "Dangerous system command", detail: "Requested command matches destructive/system modification pattern.", action: "block", meta: { kind: ctx.kind } });
      action = "block";
    }

    const suspiciousNetwork = /(curl|wget|Invoke-WebRequest|Invoke-RestMethod|wget|net\s+use|powershell -EncodedCommand)/i;
    if (suspiciousNetwork.test(text) && !TOOLS_ALLOW_LIST.has(String((ctx.payload.tool ?? ctx.payload.command ?? "") as string))) {
      findings.push({ id: crypto.randomUUID(), ruleId: "unapproved_network_tool", level: "warn", title: "Unapproved network command", detail: "Network-capable command without approved allow-list match.", action: "approval", meta: { kind: ctx.kind } });
      if (action === "allow") action = "approval";
    }

    const injectionMarkers = /(__import__|exec\(|eval\(|Function\(|child_process|spawn\(|execFile\(|system\(|Win32_Process\.Create|schtasks|at\s+\d+:\d+)/i;
    if (injectionMarkers.test(text)) {
      findings.push({ id: crypto.randomUUID(), ruleId: "prompt_injection_attempt", level: "warn", title: "Possible prompt injection", detail: "Matched risky instruction/code execution markers.", action: "approval", meta: { kind: ctx.kind } });
      if (action !== "block") action = "approval";
    }

    const hasRegistryAction = /(registry|AppLocker|Defender|AppContainer)/i.test(text);
    if (ctx.kind === "registry_entry" && !hasRegistryAction) {
      findings.push({
        id: crypto.randomUUID(),
        ruleId: "registry_entry_unknown_reference",
        level: "warn",
        title: "Registry entry missing expected policy references",
        detail: "New registry payload should include policy module hints.",
        action: "approval",
      });
      if (action === "allow") action = "approval";
    }

    const redactions: Record<string, string> = {};
    if (action === "redact" && findings.some((x) => x.ruleId === "secret_leak" || x.ruleId === "sensitive_context_key")) {
      redactions["**payload**"] = "[REDACTED_BY_SENTINEL]";
    }

    return { action, findings, redactions };
  }
}
