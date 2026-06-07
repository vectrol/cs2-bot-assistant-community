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

export function discoverCs2Roots() {
  return invoke<Cs2RootCandidate[]>('discover_cs2_roots')
}

export function inspectCs2Root(rootPath: string) {
  return invoke<Cs2EnvironmentStatus>('inspect_cs2_root', { rootPath })
}

export function checkCs2Process() {
  return invoke<boolean>('check_cs2_process')
}

export function launchCs2Game() {
  return invoke<void>('launch_cs2_game')
}

export function installBotPackage(rootPath: string) {
  return invoke<OperationResult>('install_bot_package', { rootPath })
}

export function applyDifficultyProfile(rootPath: string, preset: DifficultyPreset) {
  return invoke<OperationResult>('apply_difficulty_profile', { rootPath, preset })
}

export function setGameModeProfile(rootPath: string, preset: GameModePreset) {
  return invoke<OperationResult>('set_game_mode_profile', { rootPath, preset })
}

export function getAiApiConfig(rootPath: string) {
  return invoke<AiApiConfig>('get_ai_api_config', { rootPath })
}

export function saveAiApiConfig(rootPath: string, config: AiApiConfig) {
  return invoke<OperationResult>('save_ai_api_config', { rootPath, config })
}

export function getBotTauntsConfig(rootPath: string) {
  return invoke<BotTauntsConfig>('get_bot_taunts_config', { rootPath })
}

export function saveBotTauntsConfig(rootPath: string, config: BotTauntsConfig) {
  return invoke<OperationResult>('save_bot_taunts_config', { rootPath, config })
}

export function resetBotTauntsConfig(rootPath: string) {
  return invoke<BotTauntsConfig>('reset_bot_taunts_config', { rootPath })
}

export function getNadeRecoveryConfig(rootPath: string) {
  return invoke<NadeRecoveryConfig>('get_nade_recovery_config', { rootPath })
}

export function saveNadeRecoveryConfig(rootPath: string, config: NadeRecoveryConfig) {
  return invoke<OperationResult>('save_nade_recovery_config', { rootPath, config })
}

export function getCommandsTxt() {
  return invoke<CommandsTxtPayload>('get_commands_txt')
}

export function discoverDemos(rootPath: string) {
  return invoke<DemoDiscoveryPayload>('discover_demos', { rootPath })
}

export function openRecentDemoDirectory(rootPath: string) {
  return invoke<OperationResult>('open_recent_demo_directory', { rootPath })
}

export function openDemoDirectory(rootPath: string, directoryPath: string) {
  return invoke<OperationResult>('open_demo_directory', { rootPath, directoryPath })
}

export function openReplaysDirectory(rootPath: string) {
  return invoke<OperationResult>('open_replays_directory', { rootPath })
}

export function uninstallBotPackage(rootPath: string) {
  return invoke<OperationResult>('uninstall_bot_package', { rootPath })
}

export function getDiagnosticsPayload(rootPath?: string) {
  return invoke<DiagnosticsPayload>('get_diagnostics_payload', { rootPath })
}
