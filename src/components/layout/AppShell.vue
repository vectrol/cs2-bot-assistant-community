<script setup lang="ts">
import { computed, onMounted, provide, ref, watch } from 'vue'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { RouterLink, RouterView, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'

import { appConfig } from '@/config/app'
import GlobalStatusBar from '@/components/layout/GlobalStatusBar.vue'
import LaunchGameModal from '@/components/LaunchGameModal.vue'
import WindowControls from '@/components/layout/WindowControls.vue'
import { useThemePreference } from '@/composables/useThemePreference'
import { useUpdateChecker } from '@/composables/useUpdateChecker'
import { useCs2Store } from '@/stores/cs2'
import { useUiPreferencesStore } from '@/stores/ui-preferences'

const route = useRoute()
const store = useCs2Store()
const preferences = useUiPreferencesStore()
const { initializeTheme } = useThemePreference()
const { t } = useI18n()
const {
  updateInfo,
  checkForUpdates,
  isDismissed,
  dismissVersion,
} = useUpdateChecker()
const launchGameModalOpen = ref(false)
const updateModalOpen = ref(false)
const sidebarCollapsed = ref(false)
const appWindow = '__TAURI_INTERNALS__' in window ? getCurrentWindow() : null

provide('openLaunchGameModal', () => {
  launchGameModalOpen.value = true
})

const navItems = computed(() => [
  { label: t('nav.quickControl'), to: '/quick-control', icon: '⚡' },
  { label: t('nav.inventory'), to: '/inventory', icon: '🎒' },
  { label: t('nav.commands'), to: '/commands', icon: '⌨' },
  { label: t('nav.configConsole'), to: '/config', icon: '⚙' },
  { label: t('nav.guideHelp'), to: '/guide', icon: '📖' },
  { label: t('nav.settings'), to: '/settings', icon: '🎨' },
])

const isDashboard = computed(() => route.path === '/')

async function startWindowDrag(event: MouseEvent) {
  if (event.button !== 0 || event.detail > 1) return
  if (!appWindow) return
  try { await appWindow.startDragging() } catch { /* noop */ }
}

async function toggleWindowMaximize() {
  if (!appWindow) return
  try { await appWindow.toggleMaximize() } catch { /* noop */ }
}

async function refreshGlobalStatus() {
  try {
    await store.refreshCs2Running()
    await store.refreshEnvironment()
  } catch (error) {
    store.setMessage(store.normalizeError(error))
  }
}

onMounted(async () => {
  preferences.load()
  initializeTheme()
  void refreshGlobalStatus()

  const info = await checkForUpdates()
  if (info && !isDismissed(info.latestVersion)) {
    updateModalOpen.value = true
  }
})

watch(() => route.fullPath, (routePath) => {
  preferences.setLastRoute(routePath)
}, { immediate: true })
</script>

<template>
  <div class="app-chrome">
    <header class="app-titlebar">
      <div class="app-titlebar-brand" @mousedown="startWindowDrag" @dblclick="toggleWindowMaximize">
        <RouterLink v-if="!isDashboard" to="/" class="back-button" title="返回仪表盘">‹</RouterLink>
        <span>{{ appConfig.appName }}</span>
        <small>v{{ appConfig.appVersion }}</small>
      </div>
      <div class="app-titlebar-drag" aria-hidden="true" @mousedown="startWindowDrag" @dblclick="toggleWindowMaximize" />
      <div class="app-titlebar-actions">
        <button class="ghost-button" type="button" :disabled="store.busy" @click="refreshGlobalStatus">
          {{ t('app.refresh') }}
        </button>
        <button class="primary-button" type="button" @click="launchGameModalOpen = true">
          {{ t('app.openCs2') }}
        </button>
      </div>
      <WindowControls />
    </header>

    <div class="shell chrome-shell">
      <aside class="sidebar" :data-collapsed="sidebarCollapsed">
        <nav class="nav">
          <RouterLink
            v-for="item in navItems"
            :key="item.to"
            :to="item.to"
            class="nav-link"
            :class="{ active: route.path.startsWith(item.to) }"
          >
            <span class="nav-link__icon">{{ item.icon }}</span>
            <span class="nav-link__label">{{ item.label }}</span>
          </RouterLink>
        </nav>

        <button class="sidebar-toggle" type="button" @click="sidebarCollapsed = !sidebarCollapsed">
          {{ sidebarCollapsed ? '►' : '◄' }}
        </button>
      </aside>

      <main class="content">
        <header v-if="!isDashboard" class="page-header">
          <h2>{{ navItems.find(i => route.path.startsWith(i.to))?.label || '' }}</h2>
        </header>

        <RouterView />
      </main>
    </div>

    <LaunchGameModal :open="launchGameModalOpen" @close="launchGameModalOpen = false" />

    <Teleport to="body">
      <div v-if="updateModalOpen && updateInfo" class="update-backdrop" role="dialog" aria-modal="true">
        <article class="update-modal">
          <button class="update-modal__close" type="button" :aria-label="t('app.close')" @click="updateModalOpen = false">
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <path d="m7 7 10 10" />
              <path d="m17 7-10 10" />
            </svg>
          </button>
          <div class="update-modal__content">
            <p class="eyebrow">{{ t('update.newVersion') }}</p>
            <h3>{{ updateInfo.title }}</h3>
            <p class="muted">
              v{{ updateInfo.currentVersion }} → <strong>v{{ updateInfo.latestVersion }}</strong>
            </p>
            <pre class="update-modal__body">{{ updateInfo.body }}</pre>
            <div class="update-modal__actions">
              <a v-if="updateInfo.downloadUrl" :href="updateInfo.downloadUrl" class="primary-button" target="_blank" rel="noopener noreferrer">{{ t('update.download') }}</a>
              <a :href="updateInfo.htmlUrl" class="ghost-button" target="_blank" rel="noopener noreferrer">{{ t('update.viewOnGithub') }}</a>
              <button class="ghost-button" type="button" @click="dismissVersion(updateInfo.latestVersion); updateModalOpen = false">{{ t('update.remindLater') }}</button>
            </div>
          </div>
        </article>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.back-button {
  text-decoration: none;
  color: var(--text-muted);
  font-size: 1.4rem;
  padding: 0 0.25rem;
  line-height: 1;
}
.back-button:hover {
  color: var(--text-primary);
}

.app-titlebar-actions {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-right: auto;
}

.sidebar {
  width: 200px;
  display: flex;
  flex-direction: column;
  background: var(--panel-bg);
  border-right: 1px solid var(--panel-border);
  padding: 0.75rem 0;
  transition: width 0.2s;
  overflow: hidden;
}

.sidebar[data-collapsed='true'] {
  width: 56px;
}

.nav {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0 0.5rem;
  flex: 1;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.5rem 0.625rem;
  border-radius: var(--radius-sm);
  text-decoration: none;
  color: var(--text-muted);
  font-size: var(--fs-sm);
  transition: background 0.15s, color 0.15s;
}

.nav-link:hover {
  background: var(--ghost-bg);
  color: var(--text-primary);
}

.nav-link.active {
  background: color-mix(in srgb, var(--accent) 12%, transparent);
  color: var(--accent);
}

.nav-link__icon {
  font-size: 1.2rem;
  line-height: 1;
  flex-shrink: 0;
  width: 24px;
  text-align: center;
}

.nav-link__label {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sidebar[data-collapsed='true'] .nav-link__label {
  display: none;
}

.sidebar-toggle {
  border: none;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  padding: 0.5rem;
  margin: 0.5rem;
  border-radius: var(--radius-sm);
  font-size: var(--fs-sm);
  text-align: center;
}

.sidebar-toggle:hover {
  background: var(--ghost-bg);
  color: var(--text-primary);
}

.page-header {
  padding: 0.75rem 1.25rem;
  border-bottom: 1px solid var(--panel-border);
}

.page-header h2 {
  margin: 0;
  font-size: var(--fs-lg);
}

.update-backdrop {
  position: fixed;
  inset: 0;
  z-index: 999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(4px);
}

.update-modal {
  position: relative;
  width: 480px;
  max-width: 90vw;
  max-height: 80vh;
  background: var(--bg-primary);
  border: 1px solid var(--border-muted);
  border-radius: 10px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.update-modal__close {
  position: absolute;
  top: 0.6rem;
  right: 0.6rem;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  color: var(--text-muted);
  background: transparent;
  z-index: 1;
}

.update-modal__close svg { width: 16px; height: 16px; stroke: currentColor; stroke-width: 2; fill: none; }
.update-modal__close:hover { background: var(--ghost-bg); color: var(--text-primary); }
.update-modal__content { padding: 1.5rem; overflow-y: auto; }
.update-modal__body {
  margin: 0.75rem 0;
  padding: 0.75rem;
  border-radius: var(--radius-sm);
  background: var(--field-bg);
  font-size: var(--fs-xs);
  font-family: var(--font-mono);
  line-height: 1.5;
  max-height: 240px;
  overflow-y: auto;
  white-space: pre-wrap;
  word-break: break-word;
}
.update-modal__actions { display: flex; gap: 0.5rem; margin-top: 1rem; flex-wrap: wrap; }
</style>
