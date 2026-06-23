// Tauri preload adapter for OceanOS
// Mirrors the legacy Electron preload surface so the React UI can boot
// without rewiring every IPC consumer at once.
const { invoke } = window.__TAURI__.core;
const { open } = window.__TAURI__.shell;
const {
  readTextFile,
  writeTextFile,
  exists,
  createDir,
  removeFile,
  removeDir,
} = window.__TAURI__.fs;
const {
  sendNotification,
  isPermissionGranted,
  requestPermission,
} = window.__TAURI__.notification;

function toPromise(fn) {
  return (...args) => fn(...args);
}

function noopSend(..._args) {}

window.hermesAPI = {
  checkInstall: toPromise(() => invoke("check_install")),
  verifyInstall: toPromise(() => invoke("verify_install")),
  startInstall: toPromise(() => invoke("start_install")),
  inspectInstallTarget: toPromise(() => invoke("inspect_install_target")),
  validateHermesHome: toPromise((dir) => invoke("validate_ocean_home", { dir })),
  adoptHermesHome: toPromise((dir) => invoke("adopt_ocean_home", { dir })),
  quitApp: toPromise(() => invoke("quit_app")),
  onInstallProgress: (_callback) => () => {},
  getHermesVersion: toPromise(() => invoke("get_version")),
  refreshHermesVersion: toPromise(() => invoke("get_version")),
  runHermesDoctor: toPromise(() => invoke("gateway_status")),
  runHermesUpdate: toPromise(() => Promise.resolve({ success: true })),
  checkOpenClaw: toPromise(() => Promise.resolve({ found: false, path: null })),
  runClawMigrate: toPromise(() => Promise.resolve({ success: true })),
  oauthLogin: toPromise((_provider, _profile) => Promise.resolve({ success: true })),
  cancelOAuthLogin: toPromise(() => Promise.resolve(true)),
  onOAuthLoginProgress: (_callback) => () => {},
  getLocale: toPromise(() => Promise.resolve("en")),
  setLocale: toPromise((_locale) => Promise.resolve(_locale)),
  getEnv: toPromise((_profile) => Promise.resolve({})),
  setEnv: toPromise((_key, _value, _profile) => Promise.resolve(true)),
  validateChatReadiness: toPromise((_profile) =>
    Promise.resolve({ ok: false, message: "Tauri backend in progress" }),
  ),
  getConfigHealth: toPromise((_profile) => Promise.resolve({})),
  rerunConfigHealth: toPromise((_profile) => Promise.resolve({})),
  autofixConfigIssue: toPromise((_code) => Promise.resolve({ ok: true, message: "ignored" })),
  getConfigFixLog: toPromise((_maxEntries) => Promise.resolve([])),
  getConfig: toPromise((_key, _profile) => Promise.resolve(null)),
  setConfig: toPromise((_key, _value, _profile) => Promise.resolve(true)),
  getHermesHome: toPromise((_profile) => Promise.resolve("")),
  getModelConfig: toPromise((_profile) =>
    Promise.resolve({ provider: "auto", model: "", baseUrl: "" }),
  ),
  setModelConfig: toPromise((_provider, _model, _baseUrl, _profile) => Promise.resolve(true)),
  getAuxiliaryConfig: toPromise((_profile) => Promise.resolve([])),
  setAuxiliaryTask: toPromise(() => Promise.resolve(true)),
  resetAuxiliaryConfig: toPromise(() => Promise.resolve(true)),
  isRemoteMode: toPromise(() => Promise.resolve(false)),
  isRemoteOnlyMode: toPromise(() => Promise.resolve(false)),
  getConnectionConfig: toPromise(() =>
    Promise.resolve({ mode: "local", remoteUrl: "", hasApiKey: false, ssh: {} }),
  ),
  setConnectionConfig: toPromise(() => Promise.resolve(true)),
  setSshConfig: toPromise(() => Promise.resolve(true)),
  testRemoteConnection: toPromise(() => Promise.resolve(true)),
  testSshConnection: toPromise(() => Promise.resolve(true)),
  isSshTunnelActive: toPromise(() => Promise.resolve(false)),
  startSshTunnel: toPromise(() => Promise.resolve(true)),
  stopSshTunnel: toPromise(() => Promise.resolve(true)),
  sendMessage: toPromise((_input) =>
    Promise.resolve({ response: "Tauri backend wiring in progress" }),
  ),
  abortChat: toPromise(() => Promise.resolve()),
  transcribeAudio: toPromise(() => Promise.resolve("")),
  getApiServerKeyStatus: toPromise(() => Promise.resolve({ hasKey: false })),
  generateApiServerKey: toPromise(() => Promise.resolve({ key: "" })),
  copyToClipboard: toPromise((_text) => Promise.resolve()),
  readMediaFile: toPromise(() => Promise.resolve(null)),
  saveMediaFile: toPromise(() => Promise.resolve(true)),
  mediaFileExists: toPromise(() => Promise.resolve(false)),
  showMediaMenu: noopSend,
  getPathForFile: (_file) => "",
  stageAttachment: toPromise(() => Promise.resolve("")),
  clearStagedAttachments: toPromise(() => Promise.resolve()),
  discoverProviderModels: toPromise(() =>
    Promise.resolve({ models: [], status: "unsupported", cached: false }),
  ),
  getModelContextWindow: toPromise(() => Promise.resolve(null)),
  onChatChunk: (_callback) => () => {},
  onChatReasoningChunk: (_callback) => () => {},
  onChatDone: (_callback) => () => {},
  onContextMenuCopyChat: (_callback) => () => {},
  onContextMenuSelectBubble: (_callback) => () => {},
  onChatToolProgress: (_callback) => () => {},
  onChatToolEvent: (_callback) => () => {},
  onChatUsage: (_callback) => () => {},
  onChatError: (_callback) => () => {},
  onClarifyRequest: (_callback) => () => {},
  onDisplayOptions: () => ({}),
};

window.hermesAPI.openExternal = (url) => open(url);
