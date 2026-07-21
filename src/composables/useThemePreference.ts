import { type Ref, ref, watch } from 'vue'

import { appConfig } from '@/config/app'
import { type ThemeMode, loadAccent, saveAccent, applyAccentToDocument } from '@/features/theme/themes'

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

  const themeLabel = ref('深色')

  function applyTheme(value: ThemePreference) {
    theme.value = value
    themeLabel.value = value === 'dark' ? '深色' : '亮色'
    persistTheme(value)
    applyAccentToDocument(accentHue.value, value)
  }

  function toggleTheme() {
    applyTheme(theme.value === 'dark' ? 'light' : 'dark')
  }

  function setAccent(hue: number) {
    accentHue.value = hue
    saveAccent({ hue })
    applyAccentToDocument(hue, theme.value)
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
    applyAccentToDocument(accent.hue, theme.value)
  }

  return {
    theme,
    themeLabel,
    accentHue,
    applyTheme,
    toggleTheme,
    setAccent,
    initializeTheme,
  }
}
