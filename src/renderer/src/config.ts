import { app } from "electron";
import path from "path";
import fs from "fs";

export const userDataPath: string = app.getPath("userData");
export const rootDir = (relativePath: string): string => path.join(userDataPath, relativePath);

export const buildSshControlOptions = (_args?: Record<string, unknown>) => ({});

export type ProcessOptions = Record<string, unknown>;
export const applyProcessOptions = (opts?: ProcessOptions): ProcessOptions => opts ?? {};

export function writeYaml(configPath: string, data: Record<string, unknown>): void {
  fs.mkdirSync(path.dirname(configPath), { recursive: true });
  fs.writeFileSync(configPath, yamlStringify(data), "utf-8");
}

export function readYaml(configPath: string): Record<string, unknown> | null {
  if (!fs.existsSync(configPath)) return null;
  try { return yamlParse(fs.readFileSync(configPath, "utf-8")); } catch { return null; }
}

export function yamlPath(key: string, fallback?: string): string | undefined {
  return fallback ?? key;
}

function yamlStringify(_value: unknown): string {
  return ""; // delegate actual serialization to runtime when needed.
}

function yamlParse(_text: string): Record<string, unknown> {
  return {};
}
