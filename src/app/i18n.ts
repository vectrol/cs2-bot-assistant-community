import { createI18n } from 'vue-i18n'

import enUS from '@/locales/en-US.json'
import zhCN from '@/locales/zh-CN.json'

const LOCALE_KEY = 'cs2-locale'

export function getSavedLocale(): string {
  if (typeof window === 'undefined') return 'zh-CN'
  return window.localStorage.getItem(LOCALE_KEY) || 'zh-CN'
}

export function saveLocale(locale: string) {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(LOCALE_KEY, locale)
  }
}

export const i18n = createI18n({
  legacy: false,
  locale: getSavedLocale(),
  fallbackLocale: 'zh-CN',
  messages: {
    'zh-CN': zhCN,
    'en-US': enUS,
  },
})
