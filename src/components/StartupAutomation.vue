<script setup lang="ts">
import { onMounted } from 'vue'
import { useI18n } from 'vue-i18n'

import { appConfig } from '@/config/app'
import { useCs2Store } from '@/stores/cs2'
import { useUiPreferencesStore } from '@/stores/ui-preferences'

const { t } = useI18n()
const store = useCs2Store()
const preferences = useUiPreferencesStore()

async function runInitialPackageInstall() {
  if (!('__TAURI_INTERNALS__' in window)) {
    return
  }

  preferences.load()
  if (
    !preferences.autoInstallOnFirstRunEnabled
    || preferences.hasAutoInstallAttempted(appConfig.appVersion)
  ) {
    return
  }

  preferences.recordAutoInstallStatus('checking', t('startupAutomation.checking'))

  try {
    await store.scanRoots()
    await store.refreshCs2Running()

    if (store.cs2Running) {
      preferences.markAutoInstallAttempted(
        appConfig.appVersion,
        'skipped',
        t('startupAutomation.skippedCs2Running'),
      )
      return
    }

    if (!store.selectedRoot) {
      preferences.markAutoInstallAttempted(
        appConfig.appVersion,
        'skipped',
        t('startupAutomation.skippedNoDir'),
      )
      return
    }

    const result = await store.install()
    preferences.markAutoInstallAttempted(appConfig.appVersion, 'installed', result.message)
  } catch (error) {
    const message = store.normalizeError(error)
    preferences.markAutoInstallAttempted(appConfig.appVersion, 'failed', t('startupAutomation.failed', { message }))
    store.setMessage(message)
  }
}

onMounted(() => {
  void runInitialPackageInstall()
})
</script>

<template>
  <span aria-hidden="true" hidden />
</template>
