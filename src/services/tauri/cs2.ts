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

export function launchCs2Direct(rootPath: string, insecure: boolean) {
  if (!isTauriRuntime()) {
    return Promise.resolve()
  }
  return invoke<void>('launch_cs2_direct', { cs2Root: rootPath, insecure })
}

export function installBotPackage(rootPath: string) {
  if (!isTauriRuntime()) {
    return webOnlyOperation(`Web 预览不能安装资源包。目标目录：${rootPath}`)
  }
  return invoke<OperationResult>('install_bot_package', { rootPath })
}

export function applyDifficultyProfile(rootPath: string, preset: DifficultyPreset) {
  if (!isTauriRuntime()) {
    return webOnlyOperation(`Web 预览不能切换难度：${preset}。目标目录：${rootPath}`)
  }
  return invoke<OperationResult>('apply_difficulty_profile', { rootPath, preset })
}

export function setUpstreamAimPreset(rootPath: string, value: 'head' | 'mixed' | 'body') {
  if (!isTauriRuntime()) {
    return webOnlyOperation(`Web 预览不能写入 Aim 预设：${value}。目标目录：${rootPath}`)
  }
  return invoke<OperationResult>('set_upstream_aim_preset', { rootPath, value })
}

export function setUpstreamNadesPreset(rootPath: string, value: 'max' | 'more' | 'normal' | 'off') {
  if (!isTauriRuntime()) {
    return webOnlyOperation(`Web 预览不能写入投掷物预设：${value}。目标目录：${rootPath}`)
  }
  return invoke<OperationResult>('set_upstream_nades_preset', { rootPath, value })
}

export function setGameModeProfile(rootPath: string, preset: GameModePreset) {
  if (!isTauriRuntime()) {
    return webOnlyOperation(`Web 预览不能切换模式：${preset}。目标目录：${rootPath}`)
  }
  return invoke<OperationResult>('set_game_mode_profile', { rootPath, preset })
}

export function getAiApiConfig(rootPath: string) {
  if (!isTauriRuntime()) {
    return Promise.resolve<AiApiConfig>({
      aiApiUrl: '',
      aiApiKey: '',
      botRivalryEnabled: false,
      configPath: `${rootPath || 'CS2 目录'}\\game\\csgo\\addons\\counterstrikesharp\\configs\\plugins\\BotTaunt\\BotTaunt.json`,
      exists: false,
    })
  }
  return invoke<AiApiConfig>('get_ai_api_config', { rootPath })
}

export function saveAiApiConfig(rootPath: string, config: AiApiConfig) {
  if (!isTauriRuntime()) {
    void config
    return webOnlyOperation(`Web 预览不能保存 AI 聊天配置。目标目录：${rootPath}`)
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
      configPath: `${rootPath || 'CS2 目录'}\\game\\csgo\\addons\\counterstrikesharp\\configs\\plugins\\BotTaunt\\Taunts.json`,
      exists: false,
    })
  }
  return invoke<BotTauntsConfig>('get_bot_taunts_config', { rootPath })
}

export function saveBotTauntsConfig(rootPath: string, config: BotTauntsConfig) {
  if (!isTauriRuntime()) {
    void config
    return webOnlyOperation(`Web 预览不能保存嘲讽文本。目标目录：${rootPath}`)
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
      configPath: `${rootPath || 'CS2 目录'}\\game\\csgo\\addons\\counterstrikesharp\\configs\\plugins\\NadeSystem\\NadeSystem.json`,
      exists: false,
    })
  }
  return invoke<NadeRecoveryConfig>('get_nade_recovery_config', { rootPath })
}

export function saveNadeRecoveryConfig(rootPath: string, config: NadeRecoveryConfig) {
  if (!isTauriRuntime()) {
    void config
    return webOnlyOperation(`Web 预览不能保存道具压制开火时间。目标目录：${rootPath}`)
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
      content: 'Web 预览环境无法读取内置资源包中的 Commands.txt。',
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
      defaultDirectory: `${rootPath || 'CS2 目录'}\\game\\csgo\\replays`,
    })
  }
  return invoke<DemoDiscoveryPayload>('discover_demos', { rootPath })
}

export function openRecentDemoDirectory(rootPath: string) {
  if (!isTauriRuntime()) {
    return webOnlyOperation(`Web 预览不能打开 Demo 目录。目标目录：${rootPath}`)
  }
  return invoke<OperationResult>('open_recent_demo_directory', { rootPath })
}

export function openDemoDirectory(rootPath: string, directoryPath: string) {
  if (!isTauriRuntime()) {
    return webOnlyOperation(`Web 预览不能打开 Demo 目录：${directoryPath}。目标目录：${rootPath}`)
  }
  return invoke<OperationResult>('open_demo_directory', { rootPath, directoryPath })
}

export function openReplaysDirectory(rootPath: string) {
  if (!isTauriRuntime()) {
    return webOnlyOperation(`Web 预览不能打开 replays 目录。目标目录：${rootPath}`)
  }
  return invoke<OperationResult>('open_replays_directory', { rootPath })
}

export function openDiagnosticsLogDirectory() {
  if (!isTauriRuntime()) {
    return webOnlyOperation('Web 预览不能打开日志位置。桌面应用中会打开本机日志目录。')
  }
  return invoke<OperationResult>('open_diagnostics_log_directory')
}

export function uninstallBotPackage(rootPath: string) {
  if (!isTauriRuntime()) {
    return webOnlyOperation(`Web 预览不能卸载插件包。目标目录：${rootPath}`)
  }
  return invoke<OperationResult>('uninstall_bot_package', { rootPath })
}

export function getDiagnosticsPayload(rootPath?: string) {
  if (!isTauriRuntime()) {
    const logPath = 'Web 预览环境没有本机运行日志'
    const summary = [
              '应用：CS2人机助手社区版',
      `生成时间：${new Date().toLocaleString()}`,
      `日志文件：${logPath}`,
      'cs2.exe 正在运行：否',
      rootPath ? `已选择目录：${rootPath}` : '尚未选择 CS2 目录。',
      '',
      '最近日志预览：',
      'Web 预览只能验证界面，安装、写入、打开目录等能力需要在 Tauri 桌面环境中使用。',
    ].join('\n')
    return Promise.resolve<DiagnosticsPayload>({
      summary,
      fullLog: summary,
      logPath,
    })
  }
  return invoke<DiagnosticsPayload>('get_diagnostics_payload', { rootPath })
}
