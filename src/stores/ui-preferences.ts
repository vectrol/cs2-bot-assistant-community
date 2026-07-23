import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { useI18n } from 'vue-i18n'

const STORAGE_KEY = 'cs2-bot-improver.ui-preferences.v1'
export type PluginPackVariant = 'original' | 'improved'
const DEFAULT_PINNED_COMMANDS = ['bot_kick', 'bot_nades more', '-insecure']
const MAX_RECENT_COMMANDS = 8
const MAX_RECENT_ACTIONS = 8
const MAX_RESTORE_POINTS = 10

export interface RecentCommand {
  command: string
  summary: string
  usedAt: string
}

export interface RecentAction {
  label: string
  detail: string
  at: string
}

export interface RestorePoint {
  id: string
  at: string
  operation: string
  rootPath: string
  scope: string
  rollbackAvailable: boolean
}

export interface LastErrorInfo {
  message: string
  context: string
  at: string
}

export type AutoInstallStatus = 'idle' | 'checking' | 'installed' | 'skipped' | 'failed'

export interface AutoInstallState {
  status: AutoInstallStatus
  message: string
  at: string
}

interface UiPreferencesState {
  lastRoute: string
  lastSelectedRoot: string
  recentCommands: RecentCommand[]
  pinnedCommands: string[]
  recentActions: RecentAction[]
  restorePoints: RestorePoint[]
  lastError: LastErrorInfo | null
  lastDemoPath: string
  dismissedHints: string[]
  pluginPackVariant: PluginPackVariant
  autoInstallOnFirstRunEnabled: boolean
  autoInstallAttemptedVersions: string[]
  lastAutoInstall: AutoInstallState
}

function defaultState(): UiPreferencesState {
  return {
    lastRoute: '/install',
    lastSelectedRoot: '',
    recentCommands: [],
    pinnedCommands: DEFAULT_PINNED_COMMANDS,
    recentActions: [],
    restorePoints: [],
    lastError: null,
    lastDemoPath: '',
    dismissedHints: [],
    pluginPackVariant: 'original',
    autoInstallOnFirstRunEnabled: true,
    autoInstallAttemptedVersions: [],
    lastAutoInstall: {
      status: 'idle',
      message: 'Auto-install check not yet performed.',
      at: '',
    },
  }
}

function readState(): UiPreferencesState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return defaultState()
    }

    const parsed = JSON.parse(raw) as Partial<UiPreferencesState>
    const fallback = defaultState()
    return {
      lastRoute: typeof parsed.lastRoute === 'string' ? parsed.lastRoute : fallback.lastRoute,
      lastSelectedRoot: typeof parsed.lastSelectedRoot === 'string' ? parsed.lastSelectedRoot : fallback.lastSelectedRoot,
      recentCommands: Array.isArray(parsed.recentCommands) ? parsed.recentCommands.filter(isRecentCommand) : [],
      pinnedCommands: Array.isArray(parsed.pinnedCommands)
        ? parsed.pinnedCommands.filter((item): item is string => typeof item === 'string')
        : fallback.pinnedCommands,
      recentActions: Array.isArray(parsed.recentActions) ? parsed.recentActions.filter(isRecentAction) : [],
      restorePoints: Array.isArray(parsed.restorePoints) ? parsed.restorePoints.filter(isRestorePoint) : [],
      lastError: isLastError(parsed.lastError) ? parsed.lastError : null,
      lastDemoPath: typeof parsed.lastDemoPath === 'string' ? parsed.lastDemoPath : '',
      dismissedHints: Array.isArray(parsed.dismissedHints)
        ? parsed.dismissedHints.filter((item): item is string => typeof item === 'string')
        : [],
      pluginPackVariant: parsed.pluginPackVariant === 'original' || parsed.pluginPackVariant === 'improved'
        ? parsed.pluginPackVariant
        : fallback.pluginPackVariant,
      autoInstallOnFirstRunEnabled:
        typeof parsed.autoInstallOnFirstRunEnabled === 'boolean'
          ? parsed.autoInstallOnFirstRunEnabled
          : fallback.autoInstallOnFirstRunEnabled,
      autoInstallAttemptedVersions: Array.isArray(parsed.autoInstallAttemptedVersions)
        ? parsed.autoInstallAttemptedVersions.filter((item): item is string => typeof item === 'string')
        : [],
      lastAutoInstall: isAutoInstallState(parsed.lastAutoInstall)
        ? parsed.lastAutoInstall
        : fallback.lastAutoInstall,
    }
  } catch {
    return defaultState()
  }
}

function isRecentCommand(item: unknown): item is RecentCommand {
  return Boolean(
    item
      && typeof item === 'object'
      && typeof Reflect.get(item, 'command') === 'string'
      && typeof Reflect.get(item, 'summary') === 'string'
      && typeof Reflect.get(item, 'usedAt') === 'string',
  )
}

function isRecentAction(item: unknown): item is RecentAction {
  return Boolean(
    item
      && typeof item === 'object'
      && typeof Reflect.get(item, 'label') === 'string'
      && typeof Reflect.get(item, 'detail') === 'string'
      && typeof Reflect.get(item, 'at') === 'string',
  )
}

function isRestorePoint(item: unknown): item is RestorePoint {
  return Boolean(
    item
      && typeof item === 'object'
      && typeof Reflect.get(item, 'id') === 'string'
      && typeof Reflect.get(item, 'operation') === 'string'
      && typeof Reflect.get(item, 'rootPath') === 'string'
      && typeof Reflect.get(item, 'scope') === 'string'
      && typeof Reflect.get(item, 'at') === 'string',
  )
}

function isLastError(item: unknown): item is LastErrorInfo {
  return Boolean(
    item
      && typeof item === 'object'
      && typeof Reflect.get(item, 'message') === 'string'
      && typeof Reflect.get(item, 'context') === 'string'
      && typeof Reflect.get(item, 'at') === 'string',
  )
}

function isAutoInstallState(item: unknown): item is AutoInstallState {
  return Boolean(
    item
      && typeof item === 'object'
      && ['idle', 'checking', 'installed', 'skipped', 'failed'].includes(String(Reflect.get(item, 'status')))
      && typeof Reflect.get(item, 'message') === 'string'
      && typeof Reflect.get(item, 'at') === 'string',
  )
}

function nowIso() {
  return new Date().toISOString()
}

function makeRestoreId() {
  return `restore-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export const useUiPreferencesStore = defineStore('uiPreferences', () => {
  const { t } = useI18n()
  const state = ref<UiPreferencesState>(defaultState())
  const loaded = ref(false)

  const recentCommands = computed(() => state.value.recentCommands)
  const pinnedCommands = computed(() => state.value.pinnedCommands)
  const recentActions = computed(() => state.value.recentActions)
  const restorePoints = computed(() => state.value.restorePoints)
  const lastRoute = computed(() => state.value.lastRoute)
  const lastSelectedRoot = computed(() => state.value.lastSelectedRoot)
  const lastError = computed(() => state.value.lastError)
  const lastDemoPath = computed(() => state.value.lastDemoPath)
  const pluginPackVariant = computed(() => state.value.pluginPackVariant)
  const autoInstallOnFirstRunEnabled = computed(() => state.value.autoInstallOnFirstRunEnabled)
  const autoInstallAttemptedVersions = computed(() => state.value.autoInstallAttemptedVersions)
  const lastAutoInstall = computed(() => state.value.lastAutoInstall)

  function load() {
    if (loaded.value || typeof window === 'undefined') {
      return
    }
    state.value = readState()
    loaded.value = true
  }

  function persist() {
    if (typeof window === 'undefined') {
      return
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state.value))
  }

  function setLastRoute(routePath: string) {
    load()
    if (!routePath || routePath === state.value.lastRoute) {
      return
    }
    state.value.lastRoute = routePath
    persist()
  }

  function setLastSelectedRoot(rootPath: string) {
    load()
    if (!rootPath || rootPath === state.value.lastSelectedRoot) {
      return
    }
    state.value.lastSelectedRoot = rootPath
    persist()
  }

  function recordCommand(command: string, summary: string) {
    load()
    const trimmed = command.trim()
    if (!trimmed) {
      return
    }
    state.value.recentCommands = [
      { command: trimmed, summary, usedAt: nowIso() },
      ...state.value.recentCommands.filter((item) => item.command !== trimmed),
    ].slice(0, MAX_RECENT_COMMANDS)
    persist()
  }

  function togglePinnedCommand(command: string) {
    load()
    const trimmed = command.trim()
    if (!trimmed) {
      return
    }
    state.value.pinnedCommands = state.value.pinnedCommands.includes(trimmed)
      ? state.value.pinnedCommands.filter((item) => item !== trimmed)
      : [trimmed, ...state.value.pinnedCommands]
    persist()
  }

  function recordAction(label: string, detail: string) {
    load()
    state.value.recentActions = [
      { label, detail, at: nowIso() },
      ...state.value.recentActions,
    ].slice(0, MAX_RECENT_ACTIONS)
    persist()
  }

  function createRestorePoint(operation: string, rootPath: string, scope: string, rollbackAvailable = false) {
    load()
    const point: RestorePoint = {
      id: makeRestoreId(),
      at: nowIso(),
      operation,
      rootPath: rootPath || t('store.dirNotSelected'),
      scope,
      rollbackAvailable,
    }
    state.value.restorePoints = [point, ...state.value.restorePoints].slice(0, MAX_RESTORE_POINTS)
    persist()
    return point
  }

  function recordError(message: string, context?: string) {
    load()
    state.value.lastError = {
      message,
      context: context || t('store.generalOperation'),
      at: nowIso(),
    }
    persist()
  }

  function setLastDemoPath(path: string) {
    load()
    state.value.lastDemoPath = path
    persist()
  }

  function setPluginPackVariant(variant: PluginPackVariant) {
    load()
    state.value.pluginPackVariant = variant
    persist()
  }

  function isHintDismissed(key: string) {
    load()
    return state.value.dismissedHints.includes(key)
  }

  function dismissHint(key: string) {
    load()
    if (!state.value.dismissedHints.includes(key)) {
      state.value.dismissedHints = [key, ...state.value.dismissedHints]
      persist()
    }
  }

  function setAutoInstallOnFirstRunEnabled(enabled: boolean) {
    load()
    state.value.autoInstallOnFirstRunEnabled = enabled
    persist()
  }

  function hasAutoInstallAttempted(version: string) {
    load()
    return state.value.autoInstallAttemptedVersions.includes(version)
  }

  function recordAutoInstallStatus(status: AutoInstallStatus, message: string) {
    load()
    state.value.lastAutoInstall = {
      status,
      message,
      at: nowIso(),
    }
    persist()
  }

  function markAutoInstallAttempted(version: string, status: Exclude<AutoInstallStatus, 'idle' | 'checking'>, message: string) {
    load()
    if (!state.value.autoInstallAttemptedVersions.includes(version)) {
      state.value.autoInstallAttemptedVersions = [version, ...state.value.autoInstallAttemptedVersions]
    }
    state.value.lastAutoInstall = {
      status,
      message,
      at: nowIso(),
    }
    persist()
  }

  return {
    load,
    lastRoute,
    lastSelectedRoot,
    recentCommands,
    pinnedCommands,
    recentActions,
    restorePoints,
    lastError,
    lastDemoPath,
    autoInstallOnFirstRunEnabled,
    autoInstallAttemptedVersions,
    lastAutoInstall,
    setLastRoute,
    setLastSelectedRoot,
    recordCommand,
    togglePinnedCommand,
    recordAction,
    createRestorePoint,
    recordError,
    setLastDemoPath,
    isHintDismissed,
    dismissHint,
    setAutoInstallOnFirstRunEnabled,
    hasAutoInstallAttempted,
    recordAutoInstallStatus,
    markAutoInstallAttempted,
    pluginPackVariant,
    setPluginPackVariant,
  }
})
