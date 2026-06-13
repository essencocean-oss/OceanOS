import * as fs from "node:fs/promises";
import * as path from "node:path";
import type { AuditRecord } from "./types";

export class AuditLog {
  private readonly file: string;

  constructor(file = process.env.OCEANOS_AUDIT ?? "logs/sentinel.audit.jsonl") {
    this.file = path.resolve(file);
    this.ensure();
  }

  private async ensure(): Promise<void> {
    await fs.mkdir(path.dirname(this.file), { recursive: true });
    try {
      await fs.access(this.file);
    } catch {
      await fs.writeFile(this.file, "", "utf-8");
    }
  }

  async append(record: AuditRecord): Promise<void> {
    await this.ensure();
    const line = `${JSON.stringify(record)}\n`;
    await fs.appendFile(this.file, line, "utf-8");
  }

  async recent(limit = 200): Promise<AuditRecord[]> {
    await this.ensure();
    const text = await fs.readFile(this.file, "utf-8");
    const lines = text.split("\n").filter(Boolean);
    const slice = lines.slice(Math.max(lines.length - limit, 0));
    return slice.map((l) => JSON.parse(l) as AuditRecord);
  }
}

export const sentinelAudit = new AuditLog();
