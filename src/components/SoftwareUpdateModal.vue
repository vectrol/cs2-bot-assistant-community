<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { appConfig } from '@/config/app'
import { ensureSoftwareUpdateChecked, useSoftwareUpdateState } from '@/features/software-updates/state'
import type { SoftwareRelease } from '@/features/software-updates/types'
import { openExternalUrl } from '@/services/tauri/app'

const { t } = useI18n()
const seenKey = `${appConfig.projectId}.software-update-seen`
const visible = ref(false)
const release = ref<SoftwareRelease | null>(null)
const openMessage = ref('')
const updateState = useSoftwareUpdateState()

const updateSeverity = computed(() => {
  if (release.value?.severity === 'critical' || release.value?.isCritical === true) return 'critical'
  return release.value?.severity ?? 'normal'
})
const isCritical = computed(() => updateSeverity.value === 'critical')
const isRecommended = computed(() => updateSeverity.value === 'recommended')
const eyebrow = computed(() => {
  if (isCritical.value) return t('softwareUpdate.critical')
  if (isRecommended.value) return t('softwareUpdate.recommended')
  return t('softwareUpdate.normal')
})
const defaultSummary = computed(() => {
  if (isCritical.value) return t('softwareUpdate.criticalSummary')
  if (isRecommended.value) return t('softwareUpdate.recommendedSummary')
  return t('softwareUpdate.normalSummary')
})
const title = computed(() => {
  if (!release.value) return t('softwareUpdate.defaultTitle')
  return t('softwareUpdate.title', { name: appConfig.appName, version: release.value.version })
})

onMounted(async () => {
  const payload = updateState.payload.value ?? await ensureSoftwareUpdateChecked()
  if (!payload?.hasUpdate || !payload.latest?.download?.url) return
  release.value = { ...payload.latest, items: [...payload.latest.items], download: { ...payload.latest.download } }
  if (isCritical.value || isRecommended.value || window.localStorage.getItem(seenKey) !== payload.latest.version) {
    visible.value = true
  }
})

function dismiss() {
  if (!release.value || isCritical.value) return
  if (isRecommended.value) { visible.value = false; return }
  window.localStorage.setItem(seenKey, release.value.version)
  visible.value = false
}

async function openDownload() {
  if (!release.value?.download.url) return
  try {
    await openExternalUrl(release.value.download.url)
    openMessage.value = ''
  } catch {
    openMessage.value = t('softwareUpdate.openFailed')
  }
}
</script>

<template>
  <div v-if="visible && release" class="modal-backdrop" role="dialog" aria-modal="true" :aria-label="title">
    <article class="release-modal">
      <div class="section-head">
        <div>
          <p class="eyebrow">{{ eyebrow }}</p>
          <h3>{{ title }}</h3>
        </div>
      </div>

      <p class="muted">{{ release.summary || defaultSummary }}</p>
      <p v-if="isCritical" class="message-line">{{ t('softwareUpdate.criticalSummary') }}</p>
      <p v-else-if="isRecommended" class="message-line">{{ t('softwareUpdate.recommendedSummary') }}</p>
      <p v-if="release.download.code" class="message-line">{{ t('softwareUpdate.extractCode', { code: release.download.code }) }}</p>

      <div v-if="release.items.length" class="release-list">
        <p v-for="item in release.items" :key="item">{{ item }}</p>
      </div>

      <p v-if="openMessage" class="message-line">{{ openMessage }}</p>

      <div class="actions-row release-actions">
        <button class="primary-button" type="button" @click="openDownload">
          {{ release.download.label || t('softwareUpdate.downloadLabel') }}
        </button>
        <button v-if="!isCritical" class="ghost-button" type="button" @click="dismiss">
          {{ t('softwareUpdate.dismiss') }}
        </button>
      </div>
    </article>
  </div>
</template>
