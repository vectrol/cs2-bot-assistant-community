import { type Ref, ref } from 'vue'

import { appConfig } from '@/config/app'
import {
  type ThemeMode,
  type AnimationSpeed,
  loadAccent,
  saveAccent,
  loadThemePreferences,
  saveThemePreferences,
  applyAccentToDocument,
} from '@/features/theme/themes'

type ThemePreference = ThemeMode

const DEFAULT_THEME: ThemePreference = 'dark'

function persistTheme(value: ThemePreference) {
  document.documentElement.dataset.theme = value
  document.documentElement.style.colorScheme = value
  localStorage.setItem(appConfig.themeStorageKey, value)
}

export function useThemePreference() {
  const theme: Ref<ThemePreference> = ref(DEFAULT_THEME)
  const accentHue: Ref<number> = ref(200)
  const glassOpacity: Ref<number> = ref(1)
  const animationSpeed: Ref<AnimationSpeed> = ref('normal')

  const themeLabel = ref('深色')

  function applyPrefs() {
    applyAccentToDocument(accentHue.value, theme.value, {
      glassOpacity: glassOpacity.value,
      animationSpeed: animationSpeed.value,
    })
  }

  function saveAllPrefs() {
    saveThemePreferences({
      glassOpacity: glassOpacity.value,
      animationSpeed: animationSpeed.value,
    })
  }

  function applyTheme(value: ThemePreference) {
    theme.value = value
    themeLabel.value = value === 'dark' ? '深色' : '亮色'
    persistTheme(value)
    applyPrefs()
  }

  function toggleTheme() {
    applyTheme(theme.value === 'dark' ? 'light' : 'dark')
  }

  function setAccent(hue: number) {
    accentHue.value = hue
    saveAccent({ hue })
    applyPrefs()
  }

  function setGlassOpacity(value: number) {
    glassOpacity.value = value
    applyPrefs()
    saveAllPrefs()
  }

  function setAnimationSpeed(value: AnimationSpeed) {
    animationSpeed.value = value
    document.documentElement.dataset.animSpeed = value === 'normal' ? '' : value
    applyPrefs()
    saveAllPrefs()
  }

  function initializeTheme() {
    const stored = localStorage.getItem(appConfig.themeStorageKey) as ThemePreference | null
    if (stored === 'dark' || stored === 'light') {
      applyTheme(stored)
    } else if (window.matchMedia('(prefers-color-scheme: light)').matches) {
      applyTheme('light')
    } else {
      applyTheme(DEFAULT_THEME)
    }
    const accent = loadAccent()
    accentHue.value = accent.hue

    const prefs = loadThemePreferences()
    glassOpacity.value = prefs.glassOpacity
    animationSpeed.value = prefs.animationSpeed
    if (prefs.animationSpeed !== 'normal') {
      document.documentElement.dataset.animSpeed = prefs.animationSpeed
    }
    applyPrefs()
  }

  return {
    theme,
    themeLabel,
    accentHue,
    glassOpacity,
    animationSpeed,
    applyTheme,
    toggleTheme,
    setAccent,
    setGlassOpacity,
    setAnimationSpeed,
    initializeTheme,
  }
}
