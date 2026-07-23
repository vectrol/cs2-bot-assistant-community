import { invoke } from '@tauri-apps/api/core'

import type {
  AiApiConfig,
  BotTauntsConfig,
  CommandsTxtPayload,
  Cs2EnvironmentStatus,
  Cs2RootCandidate,
  DemoDiscoveryPayload,
  DiagnosticsPayload,
  DifficultyPreset,
  GameModePreset,
  NadeRecoveryConfig,
  OperationResult,
  PluginInfo,
} from '@/types/cs2'

function isTauriRuntime() {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window
}

function emptyEnvironment(rootPath: string): Cs2EnvironmentStatus {
  return {
    rootPath,
    gameDirExists: false,
    csgoDirExists: false,
    metamodExists: false,
    counterstrikeSharpExists: false,
    gameinfoExists: false,
    activeBotprofileExists: false,
    backupOnlineGameinfoExists: false,
    backupWithbotsGameinfoExists: false,
    lowProfileExists: false,
    mediumProfileExists: false,
    highProfileExists: false,
    botHiderExists: false,
    rayTraceExists: false,
    coreConfigExists: false,
    botHiderImplExists: false,
    rayTraceImplExists: false,
    roundDamageRecapExists: false,
    inventorySimulatorExists: false,
    pluginVersions: {},
    cssVersion: '',
    activeGameMode: '',
    baseEnvironmentReady: false,
  }
}

function webOnlyOperation(message: string): Promise<OperationResult> {
  return Promise.resolve({
    success: false,
    message,
  })
}

export function discoverCs2Roots() {
  if (!isTauriRuntime()) {
    return Promise.resolve<Cs2RootCandidate[]>([])
  }
  return invoke<Cs2RootCandidate[]>('discover_cs2_roots')
}

export function inspectCs2Root(rootPath: string) {
  if (!isTauriRuntime()) {
    return Promise.resolve(emptyEnvironment(rootPath))
  }
  return invoke<Cs2EnvironmentStatus>('inspect_cs2_root', { rootPath })
}

export function checkCs2Process() {
  if (!isTauriRuntime()) {
    return Promise.resolve(false)
  }
  return invoke<boolean>('check_cs2_process')
}

export function launchCs2Game() {
  if (!isTauriRuntime()) {
    return Promise.resolve()
  }
  return invoke<void>('launch_cs2_game')
}

export function launchCs2Direct(rootPath: string, insecure: boolean, extraArgs: string[] = []) {
  if (!isTauriRuntime()) {
    return Promise.resolve()
  }
  return invoke<void>('launch_cs2_direct', { cs2Root: rootPath, insecure, extraArgs })
}

export function installBotPackage(rootPath: string, variant?: string) {
  if (!isTauriRuntime()) {
    return webOnlyOperation(`Web preview cannot install packages. Target: ${rootPath}`)
  }
  return invoke<OperationResult>('install_bot_package', { rootPath, variant: variant ?? null })
}

export function applyDifficultyProfile(rootPath: string, preset: DifficultyPreset) {
  if (!isTauriRuntime()) {
    return webOnlyOperation(`Web preview cannot switch difficulty: ${preset}. Target: ${rootPath}`)
  }
  return invoke<OperationResult>('apply_difficulty_profile', { rootPath, preset })
}

export function setUpstreamAimPreset(rootPath: string, value: 'head' | 'mixed' | 'body') {
  if (!isTauriRuntime()) {
    return webOnlyOperation(`Web preview cannot write Aim preset: ${value}. Target: ${rootPath}`)
  }
  return invoke<OperationResult>('set_upstream_aim_preset', { rootPath, value })
}

export function setUpstreamNadesPreset(rootPath: string, value: 'max' | 'more' | 'normal' | 'off') {
  if (!isTauriRuntime()) {
    return webOnlyOperation(`Web preview cannot write grenade preset: ${value}. Target: ${rootPath}`)
  }
  return invoke<OperationResult>('set_upstream_nades_preset', { rootPath, value })
}

export function setGameModeProfile(rootPath: string, preset: GameModePreset) {
  if (!isTauriRuntime()) {
    return webOnlyOperation(`Web preview cannot switch mode: ${preset}. Target: ${rootPath}`)
  }
  return invoke<OperationResult>('set_game_mode_profile', { rootPath, preset })
}

export function getAiApiConfig(rootPath: string) {
  if (!isTauriRuntime()) {
    return Promise.resolve<AiApiConfig>({
      aiApiUrl: '',
      aiApiKey: '',
      botRivalryEnabled: false,
      configPath: `${rootPath || '(no CS2 dir)'}\\game\\csgo\\addons\\counterstrikesharp\\configs\\plugins\\BotTaunt\\BotTaunt.json`,
      exists: false,
    })
  }
  return invoke<AiApiConfig>('get_ai_api_config', { rootPath })
}

export function saveAiApiConfig(rootPath: string, config: AiApiConfig) {
  if (!isTauriRuntime()) {
    void config
    return webOnlyOperation(`Web preview cannot save AI Chat config. Target: ${rootPath}`)
  }
  return invoke<OperationResult>('save_ai_api_config', { rootPath, config })
}

export function resetAiApiConfig(rootPath: string) {
  if (!isTauriRuntime()) {
    return getAiApiConfig(rootPath)
  }
  return invoke<AiApiConfig>('reset_ai_api_config', { rootPath })
}

export function getBotTauntsConfig(rootPath: string) {
  if (!isTauriRuntime()) {
    return Promise.resolve<BotTauntsConfig>({
      normalTaunts: ['Nice try.'],
      headshotTaunts: ['Headshot.'],
      knifeTaunts: ['Knife.'],
      botRivalryTaunts: ['Bot down.'],
      openingTrashTalks: ['Round start.'],
      roundKillTaunt: 'Five kills.',
      multiKillTaunt: 'Triple kill.',
      clutchTaunt: 'Clutch.',
      saveTaunt: 'Saving.',
      configPath: `${rootPath || '(no CS2 dir)'}\\game\\csgo\\addons\\counterstrikesharp\\configs\\plugins\\BotTaunt\\Taunts.json`,
      exists: false,
    })
  }
  return invoke<BotTauntsConfig>('get_bot_taunts_config', { rootPath })
}

export function saveBotTauntsConfig(rootPath: string, config: BotTauntsConfig) {
  if (!isTauriRuntime()) {
    void config
    return webOnlyOperation(`Web preview cannot save taunt text. Target: ${rootPath}`)
  }
  return invoke<OperationResult>('save_bot_taunts_config', { rootPath, config })
}

export function resetBotTauntsConfig(rootPath: string) {
  if (!isTauriRuntime()) {
    return getBotTauntsConfig(rootPath)
  }
  return invoke<BotTauntsConfig>('reset_bot_taunts_config', { rootPath })
}

export function getNadeRecoveryConfig(rootPath: string) {
  if (!isTauriRuntime()) {
    return Promise.resolve<NadeRecoveryConfig>({
      flash: 0.55,
      smoke: 0.85,
      he: 0.65,
      molotov: 0.8,
      incgrenade: 0.8,
      decoy: 0.55,
      configPath: `${rootPath || '(no CS2 dir)'}\\game\\csgo\\addons\\counterstrikesharp\\configs\\plugins\\NadeSystem\\NadeSystem.json`,
      exists: false,
    })
  }
  return invoke<NadeRecoveryConfig>('get_nade_recovery_config', { rootPath })
}

export function saveNadeRecoveryConfig(rootPath: string, config: NadeRecoveryConfig) {
  if (!isTauriRuntime()) {
    void config
    return webOnlyOperation(`Web preview cannot save nade recovery fire suppression time. Target: ${rootPath}`)
  }
  return invoke<OperationResult>('save_nade_recovery_config', { rootPath, config })
}

export function resetNadeRecoveryConfig(rootPath: string) {
  if (!isTauriRuntime()) {
    return getNadeRecoveryConfig(rootPath)
  }
  return invoke<NadeRecoveryConfig>('reset_nade_recovery_config', { rootPath })
}

export function getCommandsTxt() {
  if (!isTauriRuntime()) {
    return Promise.resolve<CommandsTxtPayload>({
      content: 'Web preview cannot read Commands.txt from the built-in resource pack.',
      sourcePath: 'web-preview',
    })
  }
  return invoke<CommandsTxtPayload>('get_commands_txt')
}

export function discoverDemos(rootPath: string) {
  if (!isTauriRuntime()) {
    return Promise.resolve<DemoDiscoveryPayload>({
      candidates: [],
      recentDemo: null,
      defaultDirectory: `${rootPath || '(no CS2 dir)'}\\game\\csgo\\replays`,
    })
  }
  return invoke<DemoDiscoveryPayload>('discover_demos', { rootPath })
}

export function openRecentDemoDirectory(rootPath: string) {
  if (!isTauriRuntime()) {
    return webOnlyOperation(`Web preview cannot open demo directory. Target: ${rootPath}`)
  }
  return invoke<OperationResult>('open_recent_demo_directory', { rootPath })
}

export function openDemoDirectory(rootPath: string, directoryPath: string) {
  if (!isTauriRuntime()) {
    return webOnlyOperation(`Web preview cannot open demo directory: ${directoryPath}. Target: ${rootPath}`)
  }
  return invoke<OperationResult>('open_demo_directory', { rootPath, directoryPath })
}

export function openDiagnosticsLogDirectory() {
  if (!isTauriRuntime()) {
    return webOnlyOperation(`Web preview cannot open log location. Desktop app will open native log directory.`)
  }
  return invoke<OperationResult>('open_diagnostics_log_directory')
}

export function uninstallBotPackage(rootPath: string) {
  if (!isTauriRuntime()) {
    return webOnlyOperation(`Web preview cannot uninstall plugin pack. Target: ${rootPath}`)
  }
  return invoke<OperationResult>('uninstall_bot_package', { rootPath })
}

export function listPlugins(rootPath: string): Promise<PluginInfo[]> {
  if (!isTauriRuntime()) {
    return Promise.resolve<PluginInfo[]>([])
  }
  return invoke<PluginInfo[]>('list_plugins', { rootPath })
}

export function togglePlugin(rootPath: string, pluginName: string): Promise<PluginInfo | null> {
  if (!isTauriRuntime()) {
    return Promise.resolve(null)
  }
  return invoke<PluginInfo | null>('toggle_plugin', { rootPath, pluginName })
}

export function getDiagnosticsPayload(rootPath?: string) {
  if (!isTauriRuntime()) {
    const logPath = 'Web preview has no native runtime logs'
    const summary = [

      `App: CS2 Bot Assistant Community Edition`,
      `Generated: ${new Date().toLocaleString()}`,
      `Log File: ${logPath}`,
      'cs2.exe running: No',
      rootPath ? `Selected directory: ${rootPath}` : 'No CS2 directory selected.',
      '',
      'Recent log preview:',
      'Web preview can only validate the UI. Install, write, and open directory features require the Tauri desktop environment.',
    ].join('\n')
    return Promise.resolve<DiagnosticsPayload>({
      summary,
      fullLog: summary,
      logPath,
    })
  }
  return invoke<DiagnosticsPayload>('get_diagnostics_payload', { rootPath })
}
