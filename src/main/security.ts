import * as electron from "electron";
import type { ScanContext } from "../security/types";

export function hardenAttachedWebContents(webContents: electron.WebContents): void {
  webContents.setWindowOpenHandler(({ url }) => {
    const ctx: ScanContext = {
      kind: "command",
      payload: { url, action: "navigate" },
    };
    const blocked = !isAllowedExternalUrl(url) || !isAllowedAppNavigationUrl(url);
    return blocked ? { action: "deny" } : { action: "allow" };
  });
}

export function hardenWebviewPreferences(
  webPreferences: electron.WebPreferences & Record<string, unknown>,
): void {
  webPreferences.nodeIntegration = false;
  webPreferences.nodeIntegrationInWorker = false;
  webPreferences.contextIsolation = true;
  webPreferences.sandbox = true;
  webPreferences.nativeWindowOpen = true;
}

export function isAllowedAppNavigationUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return ["http:", "https:", "file:"].includes(u.protocol);
  } catch {
    return false;
  }
}

export function isAllowedExternalUrl(url: string): boolean {
  return /^https?:\/\//.test(url);
}

export function isAllowedWebviewUrl(url: string): boolean {
  return isAllowedAppNavigationUrl(url) && isAllowedExternalUrl(url);
}

export function shutdownSentinel(): void {
  // no-op for now; audit/gate hooks live under src/security/* and are not yet wired into main/index
}
