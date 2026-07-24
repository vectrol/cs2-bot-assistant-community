<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { getCurrentWindow } from '@tauri-apps/api/window'

const { t } = useI18n()
const appWindow = '__TAURI_INTERNALS__' in window ? getCurrentWindow() : null

async function minimizeWindow() {
  if (!appWindow) {
    return
  }

  try {
    await appWindow.minimize()
  } catch { /* noop */ }
}

async function toggleMaximizeWindow() {
  if (!appWindow) {
    return
  }

  try {
    await appWindow.toggleMaximize()
  } catch { /* noop */ }
}

async function closeWindow() {
  if (!appWindow) {
    return
  }

  try {
    await appWindow.close()
  } catch { /* noop */ }
}
</script>

<template>
  <div v-if="appWindow" class="window-controls" :aria-label="t('windowControls.region')">
    <button
      class="window-control"
      type="button"
      :title="t('windowControls.minimize')"
      :aria-label="t('windowControls.minimize')"
      @mousedown.stop
      @click.stop="minimizeWindow"
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" class="window-control__icon window-control__icon--minimize">
        <path d="M7 15.5h10" />
      </svg>
    </button>
    <button
      class="window-control"
      type="button"
      :title="t('windowControls.maximize')"
      :aria-label="t('windowControls.maximize')"
      @mousedown.stop
      @click.stop="toggleMaximizeWindow"
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" class="window-control__icon window-control__icon--maximize">
        <rect x="7.25" y="7.25" width="9.5" height="9.5" rx="1.2" />
      </svg>
    </button>
    <button
      class="window-control window-control--close"
      type="button"
      :title="t('windowControls.close')"
      :aria-label="t('windowControls.close')"
      @mousedown.stop
      @click.stop="closeWindow"
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" class="window-control__icon window-control__icon--close">
        <path d="m7.5 7.5 9 9" />
        <path d="m16.5 7.5-9 9" />
      </svg>
    </button>
  </div>
</template>
