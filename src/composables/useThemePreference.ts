import { computed, ref, watch } from 'vue'

import { appConfig } from '@/config/app'

export type ThemePreference = 'dark' | 'light'

const theme = ref<ThemePreference>('dark')
let initialized = false

function persistTheme(nextTheme: ThemePreference) {
  document.documentElement.dataset.theme = nextTheme
  document.documentElement.style.colorScheme = nextTheme
  window.localStorage.setItem(appConfig.themeStorageKey, nextTheme)
}

export function useThemePreference() {
  const themeLabel = computed(() => (theme.value === 'dark' ? '深色' : '亮色'))

  function applyTheme(nextTheme: ThemePreference) {
    theme.value = nextTheme
    persistTheme(nextTheme)
  }

  function toggleTheme() {
    applyTheme(theme.value === 'dark' ? 'light' : 'dark')
  }

  function initializeTheme() {
    if (initialized || typeof window === 'undefined') {
      return
    }

    const savedTheme = window.localStorage.getItem(appConfig.themeStorageKey)
    if (savedTheme === 'dark' || savedTheme === 'light') {
      applyTheme(savedTheme)
    } else {
      const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches
      applyTheme(prefersLight ? 'light' : 'dark')
    }
    initialized = true
  }

  watch(theme, (nextTheme) => {
    if (typeof document !== 'undefined') {
      document.documentElement.style.colorScheme = nextTheme
    }
  })

  return {
    theme,
    themeLabel,
    applyTheme,
    toggleTheme,
    initializeTheme,
  }
}
