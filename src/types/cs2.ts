export interface Cs2RootCandidate {
  path: string
  source: string
}

export interface Cs2EnvironmentStatus {
  rootPath: string
  gameDirExists: boolean
  csgoDirExists: boolean
  metamodExists: boolean
  counterstrikeSharpExists: boolean
  gameinfoExists: boolean
  activeBotprofileExists: boolean
  backupOnlineGameinfoExists: boolean
  backupWithbotsGameinfoExists: boolean
  lowProfileExists: boolean
  mediumProfileExists: boolean
  highProfileExists: boolean
  botHiderExists: boolean
  rayTraceExists: boolean
  coreConfigExists: boolean
  botHiderImplExists: boolean
  rayTraceImplExists: boolean
  roundDamageRecapExists: boolean
  baseEnvironmentReady: boolean
}

export interface OperationResult {
  success: boolean
  message: string
}

export interface DemoDirectoryCandidate {
  path: string
  source: string
  exists: boolean
  demoCount: number
}

export interface RecentDemoFile {
  fileName: string
  path: string
  directoryPath: string
  modifiedAt: string
  modifiedTimestamp: number
}

export interface DemoDiscoveryPayload {
  candidates: DemoDirectoryCandidate[]
  recentDemo: RecentDemoFile | null
  defaultDirectory: string
}

export interface DiagnosticsPayload {
  summary: string
  fullLog: string
  logPath: string
}

export interface CommandsTxtPayload {
  content: string
  sourcePath: string
}

export interface AiApiConfig {
  aiApiUrl: string
  aiApiKey: string
  botRivalryEnabled: boolean
  configPath: string
  exists: boolean
}

export interface NadeRecoveryConfig {
  flash: number
  smoke: number
  he: number
  molotov: number
  incgrenade: number
  decoy: number
  configPath: string
  exists: boolean
}

export interface BotTauntsConfig {
  normalTaunts: string[]
  headshotTaunts: string[]
  knifeTaunts: string[]
  botRivalryTaunts: string[]
  openingTrashTalks: string[]
  roundKillTaunt: string
  multiKillTaunt: string
  clutchTaunt: string
  saveTaunt: string
  configPath: string
  exists: boolean
}

export interface KnifePreset { paint: number; seed: number; wear: number; nameTag: string; stattrakEnabled: boolean; stattrakCount: number; souvenirEnabled: boolean }
export interface GlovePreset { enabled: boolean; defindex: number; paint: number; seed: number; wear: number }
export interface PlayerCosmeticsPatch {
  enabled: boolean; applyToHumanPlayers: boolean; applyOnPickup: boolean; defaultKnifeDefindex: number
  presets: Record<string, KnifePreset>; gunPresets: Record<string, KnifePreset>; musicKitId: number; glove: GlovePreset
}
export interface PlayerCosmeticsState extends PlayerCosmeticsPatch { configPath: string; pluginPresent: boolean; exists: boolean; cs2Running: boolean }
export interface DropKnivesState { bindKey: string; selected: number[]; cfgPresent: boolean; cs2Running: boolean }
export interface BotItemsState { skins: boolean; profiles: boolean; agents: boolean; music: boolean; cfgPresent: boolean; cs2Running: boolean }

export type DifficultyPreset = 'low' | 'medium' | 'high'
export type GameModePreset = 'online' | 'withBots'
