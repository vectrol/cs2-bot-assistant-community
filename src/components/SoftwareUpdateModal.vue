<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import { appConfig } from '@/config/app'
import { ensureSoftwareUpdateChecked, useSoftwareUpdateState } from '@/features/software-updates/state'
import type { SoftwareRelease } from '@/features/software-updates/types'
import { openExternalUrl } from '@/services/tauri/app'

const seenKey = `${appConfig.projectId}.software-update-seen`
const visible = ref(false)
const release = ref<SoftwareRelease | null>(null)
const openMessage = ref('')
const updateState = useSoftwareUpdateState()

const updateSeverity = computed(() => {
  if (release.value?.severity === 'critical' || release.value?.isCritical === true) {
    return 'critical'
  }

  return release.value?.severity ?? 'normal'
})
const isCritical = computed(() => updateSeverity.value === 'critical')
const isRecommended = computed(() => updateSeverity.value === 'recommended')
const eyebrow = computed(() => {
  if (isCritical.value) return '强制更新'
  if (isRecommended.value) return '推荐更新'
  return '发现新版本'
})
const defaultSummary = computed(() => {
  if (isCritical.value) return '当前版本需要更新后才能继续使用软件。'
  if (isRecommended.value) return '这个版本包含推荐升级内容。不更新也可以继续使用。'
  return '这个版本已经可以下载。'
})
const title = computed(() => {
  if (!release.value) return '发现新版本'
  return `${appConfig.appName} v${release.value.version} 已发布`
})

onMounted(async () => {
  const payload = updateState.payload.value ?? await ensureSoftwareUpdateChecked()
  if (!payload?.hasUpdate || !payload.latest?.download?.url) {
    return
  }

  release.value = {
    ...payload.latest,
    items: [...payload.latest.items],
    download: { ...payload.latest.download },
  }
  if (isCritical.value || isRecommended.value || window.localStorage.getItem(seenKey) !== payload.latest.version) {
    visible.value = true
  }
})

function dismiss() {
  if (!release.value || isCritical.value) {
    return
  }
  if (isRecommended.value) {
    visible.value = false
    return
  }
  window.localStorage.setItem(seenKey, release.value.version)
  visible.value = false
}

async function openDownload() {
  if (!release.value?.download.url) {
    return
  }

  try {
    await openExternalUrl(release.value.download.url)
    openMessage.value = ''
  } catch {
    openMessage.value = '打开夸克网盘链接失败，请稍后到更新日志页手动打开。'
  }
}
</script>

<template>
  <div
    v-if="visible && release"
    class="modal-backdrop"
    role="dialog"
    aria-modal="true"
    :aria-label="title"
  >
    <article class="release-modal">
      <div class="section-head">
        <div>
          <p class="eyebrow">{{ eyebrow }}</p>
          <h3>{{ title }}</h3>
        </div>
      </div>

      <p class="muted">{{ release.summary || defaultSummary }}</p>
      <p v-if="isCritical" class="message-line">
        当前版本需要更新后才能继续使用软件。
      </p>
      <p v-else-if="isRecommended" class="message-line">
        这个版本包含推荐升级内容。不更新也可以继续使用。
      </p>
      <p v-if="release.download.code" class="message-line">
        夸克提取码：{{ release.download.code }}
      </p>

      <div v-if="release.items.length" class="release-list">
        <p v-for="item in release.items" :key="item">{{ item }}</p>
      </div>

      <p v-if="openMessage" class="message-line">{{ openMessage }}</p>

      <div class="actions-row release-actions">
        <button class="primary-button" type="button" @click="openDownload">
          {{ release.download.label || '打开夸克网盘' }}
        </button>
        <button v-if="!isCritical" class="ghost-button" type="button" @click="dismiss">
          稍后再说
        </button>
      </div>
    </article>
  </div>
</template>
