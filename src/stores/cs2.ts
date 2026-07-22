import { computed, onMounted, ref } from 'vue'
import { defineStore } from 'pinia'
import { useI18n } from 'vue-i18n'
import { listen } from '@tauri-apps/api/event'

import { appConfig } from '@/config/app'
import {
  applyDifficultyProfile,
  checkCs2Process,
  discoverDemos,
  discoverCs2Roots,
  getAiApiConfig,
  getBotTauntsConfig,
  getDiagnosticsPayload,
  getNadeRecoveryConfig,
  inspectCs2Root,
  installBotPackage,
  launchCs2Game,
  launchCs2Direct,
  openDemoDirectory,
  openRecentDemoDirectory,
  resetBotTauntsConfig,
  resetAiApiConfig,
  resetNadeRecoveryConfig,
  saveAiApiConfig,
  saveBotTauntsConfig,
  saveNadeRecoveryConfig,
  setUpstreamAimPreset,
  setUpstreamNadesPreset,
  setGameModeProfile,
  uninstallBotPackage,
} from '@/services/tauri/cs2'
import type {
  AiApiConfig,
  BotTauntsConfig,
  Cs2EnvironmentStatus,
  Cs2RootCandidate,
  DemoDiscoveryPayload,
  DiagnosticsPayload,
  DifficultyPreset,
  GameModePreset,
  NadeRecoveryConfig,
} from '@/types/cs2'

const PERSISTED_ROOTS_KEY = appConfig.persistedRootsStorageKey

function loadPersistedRoots(): string[] {
  try {
    const raw = window.localStorage.getItem(PERSISTED_ROOTS_KEY)
    if (!raw) {
      return []
    }

    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
  } catch {
    return []
  }
}

function savePersistedRoots(paths: string[]) {
  window.localStorage.setItem(PERSISTED_ROOTS_KEY, JSON.stringify(paths))
}

function mergeCandidates(...groups: Cs2RootCandidate[][]): Cs2RootCandidate[] {
  const seen = new Set<string>()
  const merged: Cs2RootCandidate[] = []

  for (const group of groups) {
    for (const candidate of group) {
      if (seen.has(candidate.path)) {
        continue
      }
      seen.add(candidate.path)
      merged.push(candidate)
    }
  }

  return merged
}

export const useCs2Store = defineStore('cs2', () => {
  const { t } = useI18n()
  const candidates = ref<Cs2RootCandidate[]>([])
  const selectedRoot = ref('')
  const environment = ref<Cs2EnvironmentStatus | null>(null)
  const cs2Running = ref(false)
  const message = ref('')
  const busy = ref(false)
  const diagnostics = ref<DiagnosticsPayload | null>(null)
  const aiApiConfig = ref<AiApiConfig | null>(null)
  const botTauntsConfig = ref<BotTauntsConfig | null>(null)
  const nadeRecoveryConfig = ref<NadeRecoveryConfig | null>(null)
  const demoDiscovery = ref<DemoDiscoveryPayload | null>(null)

  const readyForConfig = computed(() => environment.value?.baseEnvironmentReady ?? false)

  if ('__TAURI_INTERNALS__' in window) {
    listen<{ running: boolean; timestamp: string }>('cs2-process-changed', (event) => {
      const wasRunning = cs2Running.value
      cs2Running.value = event.payload.running
      if (wasRunning && !event.payload.running && selectedRoot.value) {
        refreshEnvironment()
      }
    })
  }

  function rememberInstalledRoot(rootPath: string) {
    const nextPaths = [rootPath, ...loadPersistedRoots().filter((item) => item !== rootPath)]
    savePersistedRoots(nextPaths)

    candidates.value = mergeCandidates(
      [{ path: rootPath, source: t('store.installedRecord') }],
      candidates.value,
    )
  }

  async function scanRoots() {
    busy.value = true
    try {
      const persistedCandidates = loadPersistedRoots().map((path) => ({
        path,
        source: t('store.installedRecord'),
      }))
      const discoveredCandidates = await discoverCs2Roots()
      candidates.value = mergeCandidates(persistedCandidates, discoveredCandidates)
      message.value =
        candidates.value.length > 0 ? '' : t('store.scanFailed')

      const firstCandidate = candidates.value[0]
      if (!selectedRoot.value && firstCandidate) {
        await selectRoot(firstCandidate.path)
      }
    } catch (error) {
      candidates.value = []
      message.value = normalizeError(error)
    } finally {
      busy.value = false
    }
  }

  async function selectRoot(rootPath: string) {
    const environmentStatus = await inspectCs2Root(rootPath)
    selectedRoot.value = environmentStatus.rootPath
    environment.value = environmentStatus
    message.value = ''

    candidates.value = mergeCandidates(
      candidates.value,
      [{ path: environmentStatus.rootPath, source: t('store.currentSelection') }],
    )
  }

  async function refreshEnvironment() {
    if (!selectedRoot.value) {
      return
    }

    const environmentStatus = await inspectCs2Root(selectedRoot.value)
    selectedRoot.value = environmentStatus.rootPath
    environment.value = environmentStatus
  }

  async function refreshCs2Running() {
    cs2Running.value = await checkCs2Process()
  }

  async function refreshDiagnostics() {
    diagnostics.value = await getDiagnosticsPayload(selectedRoot.value || undefined)
    return diagnostics.value
  }

  async function refreshAiApiConfig() {
    if (!selectedRoot.value) {
      aiApiConfig.value = null
      return null
    }

    aiApiConfig.value = await getAiApiConfig(selectedRoot.value)
    return aiApiConfig.value
  }

  async function refreshNadeRecoveryConfig() {
    if (!selectedRoot.value) {
      nadeRecoveryConfig.value = null
      return null
    }

    nadeRecoveryConfig.value = await getNadeRecoveryConfig(selectedRoot.value)
    return nadeRecoveryConfig.value
  }

  async function refreshBotTauntsConfig() {
    if (!selectedRoot.value) {
      botTauntsConfig.value = null
      return null
    }

    botTauntsConfig.value = await getBotTauntsConfig(selectedRoot.value)
    return botTauntsConfig.value
  }

  async function refreshDemos() {
    if (!selectedRoot.value) {
      demoDiscovery.value = null
      return null
    }

    demoDiscovery.value = await discoverDemos(selectedRoot.value)
    message.value = demoDiscovery.value.recentDemo
      ? t('store.recentDemo', { fileName: demoDiscovery.value.recentDemo.fileName })
      : t('store.noDemoFile')
    return demoDiscovery.value
  }

  async function install() {
    if (!selectedRoot.value) throw new Error(t('store.noRoot'))

    busy.value = true
    try {
      const result = await installBotPackage(selectedRoot.value)
      await refreshEnvironment()
      rememberInstalledRoot(selectedRoot.value)
      message.value = result.message
      return result
    } finally {
      busy.value = false
    }
  }

  async function launchGame() {
    try {
      await launchCs2Game()
      message.value = t('store.launchRequestSent')
    } catch (error) {
      message.value = normalizeError(error)
      throw error
    }
  }

  async function launchGameDirect(insecure: boolean, extraArgs: string[] = []) {
    if (!selectedRoot.value) throw new Error(t('store.noRoot'))

    try {
      await launchCs2Direct(selectedRoot.value!, insecure, extraArgs)
      const extra = extraArgs.length ? ` (${extraArgs.join(' ')})` : ''
      message.value = insecure
        ? t('store.launchDirectInsecure', { extra })
        : t('store.launchDirect', { extra })
    } catch (error) {
      message.value = normalizeError(error)
      throw error
    }
  }

  async function applyDifficulty(preset: DifficultyPreset) {
    if (!selectedRoot.value) throw new Error(t('store.noRoot'))

    busy.value = true
    try {
      const result = await applyDifficultyProfile(selectedRoot.value, preset)
      message.value = result.message
      return result
    } finally {
      busy.value = false
    }
  }

  async function switchGameMode(preset: GameModePreset) {
    if (!selectedRoot.value) throw new Error(t('store.noRoot'))

    busy.value = true
    try {
      const result = await setGameModeProfile(selectedRoot.value, preset)
      message.value = result.message
      await refreshEnvironment()
      return result
    } finally {
      busy.value = false
    }
  }

  async function applyUpstreamAim(value: 'head' | 'mixed' | 'body') {
    if (!selectedRoot.value) throw new Error(t('store.noRoot'))
    busy.value = true
    try {
      const result = await setUpstreamAimPreset(selectedRoot.value, value)
      message.value = result.message
      return result
    } finally {
      busy.value = false
    }
  }

  async function applyUpstreamNades(value: 'max' | 'more' | 'normal' | 'off') {
    if (!selectedRoot.value) throw new Error(t('store.noRoot'))
    busy.value = true
    try {
      const result = await setUpstreamNadesPreset(selectedRoot.value, value)
      message.value = result.message
      return result
    } finally {
      busy.value = false
    }
  }

  async function saveAiApi(nextConfig: Pick<AiApiConfig, 'aiApiUrl' | 'aiApiKey' | 'botRivalryEnabled'>) {
    if (!selectedRoot.value) throw new Error(t('store.noRoot'))

    busy.value = true
    try {
      const payload: AiApiConfig = {
        aiApiUrl: nextConfig.aiApiUrl,
        aiApiKey: nextConfig.aiApiKey,
        botRivalryEnabled: nextConfig.botRivalryEnabled,
        configPath: aiApiConfig.value?.configPath ?? '',
        exists: aiApiConfig.value?.exists ?? false,
      }
      const result = await saveAiApiConfig(selectedRoot.value, payload)
      message.value = result.message
      await refreshAiApiConfig()
      return result
    } finally {
      busy.value = false
    }
  }

  async function resetAiApi() {
    if (!selectedRoot.value) throw new Error(t('store.noRoot'))

    busy.value = true
    try {
      aiApiConfig.value = await resetAiApiConfig(selectedRoot.value)
      message.value = t('store.resetAiApi')
      return aiApiConfig.value
    } finally {
      busy.value = false
    }
  }

  async function saveNadeRecovery(nextConfig: Pick<NadeRecoveryConfig, 'flash' | 'smoke' | 'he' | 'molotov' | 'incgrenade' | 'decoy'>) {
    if (!selectedRoot.value) throw new Error(t('store.noRoot'))

    busy.value = true
    try {
      const payload: NadeRecoveryConfig = {
        flash: nextConfig.flash,
        smoke: nextConfig.smoke,
        he: nextConfig.he,
        molotov: nextConfig.molotov,
        incgrenade: nextConfig.incgrenade,
        decoy: nextConfig.decoy,
        configPath: nadeRecoveryConfig.value?.configPath ?? '',
        exists: nadeRecoveryConfig.value?.exists ?? false,
      }
      const result = await saveNadeRecoveryConfig(selectedRoot.value, payload)
      message.value = result.message
      await refreshNadeRecoveryConfig()
      return result
    } finally {
      busy.value = false
    }
  }

  async function resetNadeRecovery() {
    if (!selectedRoot.value) throw new Error(t('store.noRoot'))

    busy.value = true
    try {
      nadeRecoveryConfig.value = await resetNadeRecoveryConfig(selectedRoot.value)
      message.value = t('store.resetNadeRecovery')
      return nadeRecoveryConfig.value
    } finally {
      busy.value = false
    }
  }

  type EditableBotTauntsConfig = Pick<
    BotTauntsConfig,
    | 'normalTaunts'
    | 'headshotTaunts'
    | 'knifeTaunts'
    | 'botRivalryTaunts'
    | 'openingTrashTalks'
    | 'roundKillTaunt'
    | 'multiKillTaunt'
    | 'clutchTaunt'
    | 'saveTaunt'
  >

  async function saveBotTaunts(nextConfig: EditableBotTauntsConfig) {
    if (!selectedRoot.value) throw new Error(t('store.noRoot'))

    busy.value = true
    try {
      const payload: BotTauntsConfig = {
        normalTaunts: nextConfig.normalTaunts,
        headshotTaunts: nextConfig.headshotTaunts,
        knifeTaunts: nextConfig.knifeTaunts,
        botRivalryTaunts: nextConfig.botRivalryTaunts,
        openingTrashTalks: nextConfig.openingTrashTalks,
        roundKillTaunt: nextConfig.roundKillTaunt,
        multiKillTaunt: nextConfig.multiKillTaunt,
        clutchTaunt: nextConfig.clutchTaunt,
        saveTaunt: nextConfig.saveTaunt,
        configPath: botTauntsConfig.value?.configPath ?? '',
        exists: botTauntsConfig.value?.exists ?? false,
      }
      const result = await saveBotTauntsConfig(selectedRoot.value, payload)
      message.value = result.message
      await refreshBotTauntsConfig()
      return result
    } finally {
      busy.value = false
    }
  }

  async function resetBotTaunts() {
    if (!selectedRoot.value) throw new Error(t('store.noRoot'))

    busy.value = true
    try {
      botTauntsConfig.value = await resetBotTauntsConfig(selectedRoot.value)
      message.value = t('store.resetBotTaunts')
      return botTauntsConfig.value
    } finally {
      busy.value = false
    }
  }

  async function openReplays() {
    if (!selectedRoot.value) throw new Error(t('store.noRoot'))

    const result = await openRecentDemoDirectory(selectedRoot.value)
    message.value = result.message
    await refreshDemos()
    return result
  }

  async function openDemoFolder(directoryPath: string) {
    if (!selectedRoot.value) throw new Error(t('store.noRoot'))

    const result = await openDemoDirectory(selectedRoot.value, directoryPath)
    message.value = result.message
    return result
  }

  async function uninstall() {
    if (!selectedRoot.value) throw new Error(t('store.noRoot'))

    busy.value = true
    try {
      const result = await uninstallBotPackage(selectedRoot.value)
      message.value = result.message
      await refreshEnvironment()
      return result
    } finally {
      busy.value = false
    }
  }

  function setMessage(nextMessage: string) {
    message.value = nextMessage
  }

  function normalizeError(error: unknown) {
    if (typeof error === 'string') {
      return error
    }

    if (error instanceof Error) {
      return error.message
    }

    if (typeof error === 'object' && error !== null && 'message' in error) {
      const errorMessage = Reflect.get(error, 'message')
      if (typeof errorMessage === 'string') {
        return errorMessage
      }
    }

    return t('store.operationFailed')
  }

  return {
    busy,
    candidates,
    selectedRoot,
    environment,
    cs2Running,
    message,
    diagnostics,
    aiApiConfig,
    botTauntsConfig,
    nadeRecoveryConfig,
    demoDiscovery,
    readyForConfig,
    scanRoots,
    selectRoot,
    refreshEnvironment,
    refreshCs2Running,
    refreshDiagnostics,
    refreshAiApiConfig,
    refreshBotTauntsConfig,
    refreshNadeRecoveryConfig,
    refreshDemos,
    install,
    launchGame,
    launchGameDirect,
    applyDifficulty,
    applyUpstreamAim,
    applyUpstreamNades,
    switchGameMode,
    saveAiApi,
    resetAiApi,
    saveBotTaunts,
    resetBotTaunts,
    saveNadeRecovery,
    resetNadeRecovery,
    openReplays,
    openDemoFolder,
    uninstall,
    setMessage,
    normalizeError,
  }
})
