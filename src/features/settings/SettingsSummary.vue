<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'

import { appConfig } from '@/config/app'
import { useThemePreference } from '@/composables/useThemePreference'
import { disableAutostart, enableAutostart, isAutostartEnabled } from '@/services/tauri/autostart'
import { openExternalUrl } from '@/services/tauri/app'
import { useUiPreferencesStore } from '@/stores/ui-preferences'
import { saveLocale } from '@/app/i18n'

const { t } = useI18n()
const preferences = useUiPreferencesStore()
const { locale } = useI18n()
const { theme, accentHue, applyTheme, setAccent, initializeTheme } = useThemePreference()
const autostartEnabled = ref(false)
const autostartLoading = ref(false)
const autostartMessage = ref('')
const sourceMessage = ref('')
const isDesktopRuntime = '__TAURI_INTERNALS__' in window

const autoInstallStatusLabel = computed(() => {
  const status = preferences.lastAutoInstall.status
  if (status === 'checking') return t('settings.autostartChecking')
  if (status === 'installed') return t('settings.autostartInstalled')
  if (status === 'skipped') return t('settings.autostartSkipped')
  if (status === 'failed') return t('settings.autostartFailed')
  return t('settings.autostartUnchecked')
})

async function syncAutostart() {
  if (!isDesktopRuntime) {
    autostartMessage.value = t('settings.autostartWebOnly')
    return
  }
  autostartLoading.value = true
  try {
    autostartEnabled.value = await isAutostartEnabled()
    autostartMessage.value = autostartEnabled.value ? t('settings.autostartOn') : t('settings.autostartOff')
  } catch (error) {
    autostartMessage.value = normalizeError(error)
  } finally {
    autostartLoading.value = false
  }
}

async function setAutostart(enabled: boolean) {
  if (!isDesktopRuntime) {
    autostartMessage.value = t('settings.autostartWebOnly')
    return
  }
  autostartLoading.value = true
  try {
    if (enabled) await enableAutostart()
    else await disableAutostart()
    autostartEnabled.value = await isAutostartEnabled()
    autostartMessage.value = autostartEnabled.value ? t('settings.autostartEnabled') : t('settings.autostartDisabled')
  } catch (error) {
    autostartMessage.value = normalizeError(error)
    autostartEnabled.value = await isAutostartEnabled().catch(() => autostartEnabled.value)
  } finally {
    autostartLoading.value = false
  }
}

function normalizeError(error: unknown) {
  if (typeof error === 'string') return error
  if (error instanceof Error) return error.message
  return t('settings.operationFailed')
}

async function openSource(url: string) {
  try {
    await openExternalUrl(url)
    sourceMessage.value = ''
  } catch (error) {
    sourceMessage.value = normalizeError(error)
  }
}

onMounted(() => {
  preferences.load()
  initializeTheme()
  void syncAutostart()
})
</script>

<template>
  <section class="page-grid settings-page">
    <article class="hero-banner settings-hero">
      <div>
        <p class="eyebrow">{{ t('settings.title') }}</p>
        <h3>{{ t('settings.storagePrivacyTitle') }}</h3>
        <p class="muted">{{ t('settings.currentVersion', { version: appConfig.appVersion }) }}</p>
      </div>
    </article>

    <article class="panel settings-section">
      <div class="section-heading">
        <div>
          <p class="eyebrow">{{ t('settings.appearance') }}</p>
          <h3>{{ t('settings.appearanceTitle') }}</h3>
        </div>
        <span class="status-pill" data-state="info">
          {{ theme === 'dark' ? t('settings.dark') : t('settings.light') }}
        </span>
      </div>
      <div class="segmented-control" :aria-label="t('settings.theme')">
        <button :data-active="theme === 'dark'" type="button" @click="applyTheme('dark')">{{ t('settings.dark') }}</button>
        <button :data-active="theme === 'light'" type="button" @click="applyTheme('light')">{{ t('settings.light') }}</button>
      </div>
      <div class="accent-picker">
        <p class="eyebrow">{{ t('settings.customAccent') }}</p>
        <div class="accent-row">
          <input type="range" :value="accentHue" min="0" max="360" class="accent-slider" @input="setAccent(Number(($event.target as HTMLInputElement).value))" />
          <span class="accent-swatch" :style="{ background: `hsl(${accentHue},85%,55%)` }" />
        </div>
      </div>

      <div class="accent-picker">
        <p class="eyebrow">{{ t('settings.languageLabel') }} / Language</p>
        <div class="segmented-control" aria-label="Language">
          <button :data-active="locale === 'zh-CN'" type="button" @click="locale = 'zh-CN'; saveLocale('zh-CN')">中文</button>
          <button :data-active="locale === 'en-US'" type="button" @click="locale = 'en-US'; saveLocale('en-US')">English</button>
        </div>
      </div>
    </article>

    <article class="panel settings-section">
      <div class="section-heading">
        <div>
          <p class="eyebrow">{{ t('settings.startup') }}</p>
          <h3>{{ t('settings.startupTitle') }}</h3>
        </div>
        <button class="ghost-button" type="button" :disabled="autostartLoading" @click="syncAutostart">{{ t('settings.reload') }}</button>
      </div>

      <div class="settings-toggle-row">
        <div>
          <strong>{{ t('settings.autostart') }}</strong>
          <p class="muted">{{ t('settings.autostartHint') }}</p>
        </div>
        <button class="switch-button" type="button" role="switch" :aria-checked="autostartEnabled" :disabled="autostartLoading || !isDesktopRuntime" @click="setAutostart(!autostartEnabled)">
          <span />
        </button>
      </div>

      <div class="settings-toggle-row">
        <div>
          <strong>{{ t('settings.autoInstallTitle') }}</strong>
          <p class="muted">{{ t('settings.autoInstallHint') }}</p>
          <p class="settings-inline-status">{{ autoInstallStatusLabel }}：{{ preferences.lastAutoInstall.message }}</p>
        </div>
        <button class="switch-button" type="button" role="switch" :aria-checked="preferences.autoInstallOnFirstRunEnabled" @click="preferences.setAutoInstallOnFirstRunEnabled(!preferences.autoInstallOnFirstRunEnabled)">
          <span />
        </button>
      </div>

      <p class="muted">{{ autostartMessage }}</p>
    </article>

    <article class="panel settings-section settings-storage">
      <div class="section-heading">
        <div>
          <p class="eyebrow">{{ t('settings.storagePrivacy') }}</p>
          <h3>{{ t('settings.storagePrivacyTitle') }}</h3>
        </div>
      </div>

      <div class="storage-list">
        <section>
          <strong>{{ t('settings.storageLocalStorage') }}</strong>
          <p>{{ t('settings.storageLocalStorageDesc') }}</p>
        </section>
        <section>
          <strong>{{ t('settings.storageCs2Dir') }}</strong>
          <p>{{ t('settings.storageCs2DirDesc') }}</p>
        </section>
        <section>
          <strong>{{ t('settings.storagePluginConfig') }}</strong>
          <p>{{ t('settings.storagePluginConfigDesc') }}</p>
        </section>
        <section>
          <strong>{{ t('settings.storageLogs') }}</strong>
          <p>{{ t('settings.storageLogsDesc') }}</p>
        </section>
      </div>

      <p class="settings-storage__notice">{{ t('settings.storageNotice') }}</p>
    </article>

    <article class="panel settings-section">
      <div class="section-heading">
        <div>
          <p class="eyebrow">{{ t('settings.versionHistory') }}</p>
          <h3>{{ t('settings.currentVersion', { version: appConfig.appVersion }) }}</h3>
        </div>
        <RouterLink class="ghost-button" to="/release-notes">{{ t('settings.viewReleaseNotes') }}</RouterLink>
      </div>
      <p class="muted">{{ t('settings.releaseNotesHint') }}</p>
      <div class="open-source-attribution">
        <p>{{ t('settings.openSourceAttribution') }}</p>
        <div>
          <button type="button" @click="openSource('https://github.com/ed0ard/CS2-Bot-Improver')">CS2-Bot-Improver</button>
          <button type="button" @click="openSource('https://github.com/numakkiyu/CS2-Bot-Improver-Plus')">CS2-Bot-Improver-Plus</button>
        </div>
        <small v-if="sourceMessage">{{ sourceMessage }}</small>
      </div>
    </article>
  </section>
</template>
