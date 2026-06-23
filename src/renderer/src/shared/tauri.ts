import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-shell";

/* eslint-disable @typescript-eslint/no-explicit-any */

export type Json = Record<string, unknown>;

function cmd<T = any>(name: string, args?: Json): Promise<T> {
  return invoke<T>(name, args as Record<string, unknown>);
}

export const tauri = {
  // Core agent ops
  runAgent: (agent: string, input: string, profile?: string) =>
    cmd("run_agent", { agent, input, profile }),
  runSkill: (name: string, args?: string[]) => cmd("run_skill", { name, args }),
  loadRegistry: () => cmd("load_registry"),
  getSkillContent: (name: string, profile?: string) =>
    cmd("get_skill_content", { name, profile }),
  gatewayStatus: () => cmd<{ running: boolean; port?: number; pid?: number }>("gateway_status"),
  startGateway: () => cmd("start_gateway"),
  stopGateway: () => cmd("stop_gateway"),
  restartGateway: (profile?: string) => cmd("restart_gateway", { profile }),
  // Skills / registry
  listInstalledSkills: (profile?: string) => cmd("list_installed_skills", { profile }),
  installSkill: (item: any, profile?: string) => cmd("install_skill", { item, profile }),
  uninstallSkill: (item: any, profile?: string) => cmd("uninstall_skill", { item, profile }),
  listBundledSkills: () => cmd("list_bundled_skills"),
  fetchRegistry: (force?: boolean) => cmd("fetch_registry", { force }),
  fetchRegistryDetail: (kind: string, item: any) =>
    cmd("fetch_registry_detail", { kind, item }),
  listInstalledRegistry: (profile?: string) => cmd("list_installed_registry", { profile }),
  installRegistryItem: (item: any, profile?: string) =>
    cmd("install_registry_item", { item, profile }),
  // Chat / sessions
  sendMessage: (input: string) => cmd("send_message", { input }),
  abortChat: () => cmd("abort_chat"),
  transcribeAudio: () => cmd("transcribe_audio"),
  getSessionMessages: (sessionId?: string) => cmd("get_session_messages", { sessionId }),
  deleteSession: (sessionId: string) => cmd("delete_session", { sessionId }),
  deleteSessions: (ids: string[]) => cmd("delete_sessions", { ids }),
  searchSessions: (query?: string) => cmd("search_sessions", { query }),
  listCachedSessions: () => cmd("list_cached_sessions"),
  syncSessionCache: () => cmd("sync_session_cache"),
  updateSessionTitle: (sessionId: string, title: string) =>
    cmd("update_session_title", { sessionId, title }),
  // Profiles
  listProfiles: () => cmd("list_profiles"),
  createProfile: (name: string, cloneConfig?: any) => cmd("create_profile", { name, cloneConfig }),
  deleteProfile: (name: string) => cmd("delete_profile", { name }),
  setActiveProfile: (name: string) => cmd("set_active_profile", { name }),
  // MCP / toolsets
  listMcpServers: (profile?: string) => cmd("list_mcp_servers", { profile }),
  addMcpServer: (server: any, profile?: string) => cmd("add_mcp_server", { server, profile }),
  removeMcpServer: (..._args: any[]) => cmd("remove_mcp_server"),
  setMcpServerEnabled: (id: string, enabled: boolean, profile?: string) =>
    cmd("set_mcp_server_enabled", { id, enabled, profile }),
  testMcpServer: (id: string, profile?: string) => cmd("test_mcp_server", { id, profile }),
  getToolsets: (profile?: string) => cmd("get_toolsets", { profile }),
  setToolsetEnabled: (id: string, enabled: boolean, profile?: string) =>
    cmd("set_toolset_enabled", { id, enabled, profile }),
  // Kanban
  kanbanListBoards: (refresh?: boolean, profile?: string) =>
    cmd("kanban_list_boards", { refresh, profile }),
  kanbanListTasks: (opts?: any) => cmd("kanban_list_tasks", opts),
  kanbanListClaw3dHqTasks: () => cmd("kanban_list_claw3d_hq_tasks"),
  kanbanGetTask: (id: string, profile?: string) => cmd("kanban_get_task", { id, profile }),
  kanbanCreateTask: (input: any, profile?: string) =>
    cmd("kanban_create_task", { input, profile }),
  kanbanSwitchBoard: (slug: string, profile?: string) =>
    cmd("kanban_switch_board", { slug, profile }),
  kanbanCreateBoard: (name: string, profile?: string) =>
    cmd("kanban_create_board", { name, profile }),
  kanbanCompleteTask: (id: string, profile?: string) =>
    cmd("kanban_complete_task", { id, profile }),
  kanbanBlockTask: (id: string, profile?: string) => cmd("kanban_block_task", { id, profile }),
  kanbanUnblockTask: (id: string, profile?: string) =>
    cmd("kanban_unblock_task", { id, profile }),
  kanbanSpecifyTask: (id: string, profile?: string) =>
    cmd("kanban_specify_task", { id, profile }),
  kanbanArchiveTask: (id: string, profile?: string) =>
    cmd("kanban_archive_task", { id, profile }),
  kanbanReclaimTask: (id: string, profile?: string) =>
    cmd("kanban_reclaim_task", { id, profile }),
  kanbanDispatchOnce: (once: boolean, profile?: string) =>
    cmd("kanban_dispatch_once", { once, profile }),
  // Config / env
  getEnv: (profile?: string) => cmd("get_env", { profile }),
  setEnv: (key: string, value: string, profile?: string) =>
    cmd("set_env", { key, value, profile }),
  getConfig: (key: string, profile?: string) => cmd("get_config", { key, profile }),
  setConfig: (key: string, value: string, profile?: string) =>
    cmd("set_config", { key, value, profile }),
  getConfigHealth: (profile?: string) => cmd("get_config_health", { profile }),
  rerunConfigHealth: (profile?: string) => cmd("rerun_config_health", { profile }),
  autofixConfigIssue: (code: string) => cmd("autofix_config_issue", { code }),
  getConfigFixLog: () => cmd("get_config_fix_log"),
  getConnectionConfig: () =>
    cmd<{ mode: string; remoteUrl?: string; apiKey?: string }>("get_connection_config"),
  setConnectionConfig: (mode: string, remoteUrl: string, apiKey: string) =>
    cmd("set_connection_config", { mode, remoteUrl, apiKey }),
  testRemoteConnection: (url: string, key?: string) =>
    cmd("test_remote_connection", { url, key }),
  setSshConfig: (..._args: any[]) => cmd("set_ssh_config"),
  testSshConnection: (..._args: any[]) => cmd("test_ssh_connection"),
  isSshTunnelActive: () => cmd("is_ssh_tunnel_active"),
  startSshTunnel: () => cmd("start_ssh_tunnel"),
  stopSshTunnel: () => cmd("stop_ssh_tunnel"),
  // Soul / memory
  readSoul: (profile?: string) => cmd("read_soul", { profile }),
  writeSoul: (content: string, profile?: string) =>
    cmd("write_soul", { content, profile }),
  resetSoul: (profile?: string) => cmd("reset_soul", { profile }),
  readMemory: (profile?: string) => cmd("read_memory", { profile }),
  readLogs: () => cmd("read_logs"),
  writeUserProfile: (profile: string, content: string) =>
    cmd("write_user_profile", { profile, content }),
  discoverMemoryProviders: () => cmd("discover_memory_providers"),
  // Messaging
  getMessagingPlatforms: (profile?: string) => cmd("get_messaging_platforms", { profile }),
  updateMessagingPlatform: (platform: any, profile?: string) =>
    cmd("update_messaging_platform", { platform, profile }),
  testMessagingPlatform: (id: string, profile?: string) =>
    cmd("test_messaging_platform", { id, profile }),
  // API server key / cron
  generateApiServerKey: (profile?: string) => cmd("generate_api_server_key", { profile }),
  getApiServerKeyStatus: (profile?: string) => cmd("get_api_server_key_status", { profile }),
  listCronJobs: () => cmd("list_cron_jobs"),
  createCronJob: () => cmd("create_cron_job"),
  triggerCronJob: (id: string) => cmd("trigger_cron_job", { id }),
  pauseCronJob: (id: string) => cmd("pause_cron_job", { id }),
  resumeCronJob: (id: string) => cmd("resume_cron_job", { id }),
  removeCronJob: (id: string) => cmd("remove_cron_job", { id }),
  // Process
  processesList: () => cmd("processes_list"),
  processesKill: (id: string) => cmd("processes_kill", { id }),
  processesRestart: (id: string) => cmd("processes_restart", { id }),
  // Models
  addModel: (model: any, profile?: string) => cmd("add_model", { model, profile }),
  updateModel: (model: any, profile?: string) => cmd("update_model", { model, profile }),
  removeModel: (id: string, profile?: string) => cmd("remove_model", { id, profile }),
  fetchModelRegistry: () => cmd("fetch_model_registry"),
  listModels: () => cmd("list_models"),
  // Misc runtime
  getAppVersion: () => cmd<string>("get_app_version").catch(() => Promise.resolve("0.1.0")),
  openExternal: (url: string) => open(url),
  getOceanOSVersion: () => cmd<string>("get_version"),
  refreshOceanOSVersion: () => cmd<string>("get_version"),
  runOceanDoctor: () => cmd("gateway_status"),
  checkOpenClaw: () => Promise.resolve({ found: false, path: null }),
  runOceanUpdate: () => Promise.resolve({ success: true }),
  runClawMigrate: () => Promise.resolve({ success: true }),
  // OceanOS home / config
  getOceanHome: (profile?: string) => cmd("get_ocean_home", { profile }),
  getModelConfig: (profile?: string) => cmd("get_model_config", { profile }),
  setModelConfig: (provider: string, model: string, baseUrl: string, profile?: string) =>
    cmd("set_model_config", { provider, model, baseUrl, profile }),
  getAuxiliaryConfig: (profile?: string) => cmd("get_auxiliary_config", { profile }),
  setAuxiliaryTask: () => cmd("set_auxiliary_task"),
  resetAuxiliaryConfig: () => cmd("reset_auxiliary_config"),
  isRemoteMode: () => cmd("is_remote_mode"),
  isRemoteOnlyMode: () => cmd("is_remote_only_mode"),
  validateOceanHome: (dir: string) => cmd("validate_ocean_home", { dir }),
  adoptOceanHome: (dir: string) => cmd("adopt_ocean_home", { dir }),
  runOceanBackup: () => cmd("run_oceanos_backup"),
  runOceanDump: () => cmd("run_oceanos_dump"),
  runOceanImport: () => cmd("run_oceanos_import"),
  // Auth
  oauthLogin: () => Promise.resolve({ success: true }),
  cancelOAuthLogin: () => Promise.resolve(true),
  // i18n
  getLocale: () => cmd("get_locale"),
  setLocale: (locale: string) => cmd("set_locale", { locale }),
  // Files / media
  readFile: (path: string, maxBytes?: number) => cmd("read_file", { path, maxBytes }),
  readImageFile: (path: string) => cmd("read_image_file", { path }),
  readDirectory: (path: string) => cmd("read_directory", { path }),
  saveMediaFile: (path: string, name: string) => cmd("save_media_file", { path, name }),
  mediaFileExists: (path: string) => cmd("media_file_exists", { path }),
  readMediaFile: () => cmd("read_media_file"),
  showMediaMenu: (..._args: any[]) => {},
  selectFolder: () => cmd("select_folder"),
  openFileInEditor: (path: string) => cmd("open_file_in_editor", { path }),
  openTerminal: (path: string) => cmd("open_terminal", { path }),
  getPathForFile: (file: string) => file,
  stageAttachment: () => cmd("stage_attachment"),
  clearStagedAttachments: () => cmd("clear_staged_attachments"),
  validateChatReadiness: (profile?: string) => cmd("validate_chat_readiness", { profile }),
  checkInstall: () => cmd("check_install"),
  verifyInstall: () => cmd("verify_install"),
  startInstall: () => cmd("start_install"),
  inspectInstallTarget: () => cmd("inspect_install_target"),
  copyToClipboard: (text: string) => cmd("copy_to_clipboard", { text }),
  quitApp: () => cmd("quit_app"),
};

export type TauriApi = typeof tauri;
