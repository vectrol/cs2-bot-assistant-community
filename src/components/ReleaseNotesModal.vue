<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { appConfig } from '@/config/app'
import { latestReleaseNote } from '@/features/release-notes/data'
import { openExternalUrl } from '@/services/tauri/app'

const { t } = useI18n()

const storageKey = `${appConfig.projectId}.release-notes-seen`
const openMessage = ref('')
const visible = ref(window.localStorage.getItem(storageKey) !== appConfig.appVersion)

const title = computed(() => t('releaseNotesModal.title', { appName: appConfig.appName, version: appConfig.appVersion }))

function closeModal() {
  window.localStorage.setItem(storageKey, appConfig.appVersion)
  visible.value = false
}

async function openReleaseLink(url: string) {
  try {
    await openExternalUrl(url)
    openMessage.value = ''
  } catch {
    openMessage.value = t('releaseNotesModal.openFailed')
  }
}
</script>

<template>
  <div v-if="visible" class="modal-backdrop" role="dialog" aria-modal="true" :aria-label="title">
    <article class="release-modal">
      <div class="section-head">
        <div>
          <p class="eyebrow">{{ t('releaseNotesModal.eyebrow') }}</p>
          <h3>{{ title }}</h3>
        </div>
      </div>

      <div class="release-list">
        <p v-for="item in latestReleaseNote.items" :key="item.text">
          <span>{{ item.text }}</span>
          <template v-if="item.links">
            <button
              v-for="link in item.links"
              :key="link.url"
              class="inline-link-button"
              type="button"
              @click="openReleaseLink(link.url)"
            >
              {{ link.label }}
            </button>
          </template>
        </p>
      </div>

      <p v-if="openMessage" class="message-line">{{ openMessage }}</p>

      <div class="actions-row release-actions">
        <button class="primary-button" @click="closeModal">{{ t('releaseNotesModal.close') }}</button>
      </div>
    </article>
  </div>
</template>
