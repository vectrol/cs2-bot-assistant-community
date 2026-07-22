import { createI18n } from 'vue-i18n'
import { createPinia } from 'pinia'
import { config } from '@vue/test-utils'

import enUS from '@/locales/en-US.json'
import zhCN from '@/locales/zh-CN.json'

const i18n = createI18n({
  legacy: false,
  locale: 'zh-CN',
  fallbackLocale: 'zh-CN',
  messages: { 'zh-CN': zhCN, 'en-US': enUS },
})

config.global.plugins = [createPinia(), i18n]
config.global.stubs = {
  RouterLink: { props: ['to'], template: '<a><slot /></a>' },
  RouterView: { template: '<div />' },
  Transition: { template: '<slot />' },
  TransitionGroup: { template: '<slot />' },
}

Object.defineProperty(import.meta, 'env', {
  value: {
    VITE_APP_NAME: 'CS2 Bot Assistant Community',
    VITE_APP_BRAND_LABEL: 'CS2 BOT ASSISTANT COMMUNITY',
    VITE_APP_CHANNEL: 'test',
    VITE_API_BASE_URL: 'http://localhost:3000',
    VITE_UPDATE_FEED_URL: '',
    VITE_ENABLE_UPDATER: 'false',
    VITE_WORKSPACE_NAME: 'Test Workspace',
    VITE_DEFAULT_PROJECT_ID: 'cs2-bot-improver',
  },
  writable: true,
})
