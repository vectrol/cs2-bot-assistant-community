<script setup lang="ts">
import { onMounted } from 'vue'

import { appConfig } from '@/config/app'
import { useCs2Store } from '@/stores/cs2'
import { useUiPreferencesStore } from '@/stores/ui-preferences'

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

  preferences.recordAutoInstallStatus('checking', '正在检查是否可以自动安装当前内置插件包。')

  try {
    await store.scanRoots()
    await store.refreshCs2Running()

    if (store.cs2Running) {
      preferences.markAutoInstallAttempted(
        appConfig.appVersion,
        'skipped',
        '检测到 CS2 正在运行，本次没有自动安装。退出游戏后可在准备环境页面手动安装。',
      )
      return
    }

    if (!store.selectedRoot) {
      preferences.markAutoInstallAttempted(
        appConfig.appVersion,
        'skipped',
        '没有识别到 CS2 目录，本次没有自动安装。请先到准备环境页面选择目录。',
      )
      return
    }

    const result = await store.install()
    preferences.markAutoInstallAttempted(appConfig.appVersion, 'installed', result.message)
  } catch (error) {
    const message = store.normalizeError(error)
    preferences.markAutoInstallAttempted(appConfig.appVersion, 'failed', message)
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
