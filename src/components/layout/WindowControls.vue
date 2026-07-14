<script setup lang="ts">
import { getCurrentWindow } from '@tauri-apps/api/window'

const appWindow = '__TAURI_INTERNALS__' in window ? getCurrentWindow() : null

async function minimizeWindow() {
  if (!appWindow) {
    return
  }

  try {
    await appWindow.minimize()
  } catch (error) {
    console.error('minimize window failed', error)
  }
}

async function toggleMaximizeWindow() {
  if (!appWindow) {
    return
  }

  try {
    await appWindow.toggleMaximize()
  } catch (error) {
    console.error('toggle maximize window failed', error)
  }
}

async function closeWindow() {
  if (!appWindow) {
    return
  }

  try {
    await appWindow.close()
  } catch (error) {
    console.error('close window failed', error)
  }
}
</script>

<template>
  <div v-if="appWindow" class="window-controls" aria-label="窗口控制">
    <button
      class="window-control"
      type="button"
      title="最小化"
      aria-label="最小化"
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
      title="最大化或还原"
      aria-label="最大化或还原"
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
      title="关闭"
      aria-label="关闭"
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
