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

export type DifficultyPreset = 'low' | 'medium' | 'high'
export type GameModePreset = 'online' | 'withBots'
