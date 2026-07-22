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
import { useUiPreferencesStore } from '@/stores/ui-preferences'

const route = useRoute()
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

const icons: Record<string, string> = {
  play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>',
  grid: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><rect x="3" y="3" width="8" height="8" rx="1"/><rect x="13" y="3" width="8" height="8" rx="1"/><rect x="3" y="13" width="8" height="8" rx="1"/><rect x="13" y="13" width="8" height="8" rx="1"/></svg>',
  terminal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 17l6-6-6-6"/><path d="M12 19h8"/></svg>',
  gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M1 12h2M21 12h2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke-linecap="round"/></svg>',
  help: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" stroke-linecap="round"/><circle cx="12" cy="17" r=".5" fill="currentColor"/></svg>',
  sliders: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><circle cx="4" cy="12" r="2"/><circle cx="12" cy="10" r="2"/><circle cx="20" cy="14" r="2"/></svg>',
  plugins: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M4 6h3M4 12h3M4 18h3"/><rect x="7" y="4" width="13" height="16" rx="2"/><path d="M12 10h5M12 14h5"/></svg>',
  folder: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M2 6a2 2 0 012-2h5l2 2h9a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="10"/></svg>',
  file: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/></svg>',
}

const navItems = computed(() => [
  { label: t('nav.quickControl'), to: '/quick-control', icon: 'play' },
  { label: t('nav.inventory'), to: '/inventory', icon: 'grid' },
  { label: t('nav.commands'), to: '/commands', icon: 'terminal' },
  { label: t('nav.configConsole'), to: '/config', icon: 'gear' },
  { label: t('nav.projects'), to: '/projects', icon: 'folder' },
  { label: t('nav.tasks'), to: '/tasks', icon: 'check' },
  { label: t('nav.logs'), to: '/logs', icon: 'file' },
  { label: t('nav.guideHelp'), to: '/guide', icon: 'help' },
  { label: t('nav.settings'), to: '/settings', icon: 'sliders' },
  { label: t('nav.plugins'), to: '/plugins', icon: 'plugins' },
])

const isDashboard = computed(() => route.path === '/')

function getIcon(name: string): string {
  return icons[name] || ''
}

async function startWindowDrag(event: MouseEvent) {
  if (event.button !== 0 || event.detail > 1) return
  if (!appWindow) return
  try { await appWindow.startDragging() } catch { /* noop */ }
}

async function toggleWindowMaximize() {
  if (!appWindow) return
  try { await appWindow.toggleMaximize() } catch { /* noop */ }
}

onMounted(async () => {
  preferences.load()
  initializeTheme()

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
        <RouterLink v-if="!isDashboard" to="/" class="back-button" :title="t('app.backToDashboard')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </RouterLink>
        <span>{{ appConfig.appName }}</span>
        <small>v{{ appConfig.appVersion }}</small>
      </div>
      <div class="app-titlebar-drag" aria-hidden="true" @mousedown="startWindowDrag" @dblclick="toggleWindowMaximize" />
      <div class="app-titlebar-actions">
        <button class="primary-button" type="button" @click="launchGameModalOpen = true">
          {{ t('app.openCs2') }}
        </button>
      </div>
      <WindowControls />
    </header>

    <div class="shell chrome-shell">
      <aside class="sidebar glass" :data-collapsed="sidebarCollapsed">
        <nav class="nav">
          <RouterLink
            v-for="item in navItems"
            :key="item.to"
            :to="item.to"
            class="nav-link"
            :class="{ active: route.path === item.to }"
          >
            <span class="nav-link__icon" v-html="getIcon(item.icon)" />
            <span class="nav-link__label">{{ item.label }}</span>
          </RouterLink>
        </nav>

        <button class="sidebar-toggle" type="button" @click="sidebarCollapsed = !sidebarCollapsed">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 18l6-6-6-6"/></svg>
        </button>
      </aside>

      <main class="content">
        <header v-if="!isDashboard" class="page-header">
          <h2>{{ navItems.find(i => route.path === i.to)?.label || '' }}</h2>
        </header>

        <div class="page-transition-wrapper">
          <RouterView v-slot="{ Component }">
            <Transition name="page" mode="out-in">
              <component :is="Component" />
            </Transition>
          </RouterView>
        </div>
      </main>
    </div>

    <LaunchGameModal :open="launchGameModalOpen" @close="launchGameModalOpen = false" />

    <Teleport to="body">
      <div v-if="updateModalOpen && updateInfo" class="update-backdrop" role="dialog" aria-modal="true">
        <article class="update-modal glass" style="backdrop-filter: blur(28px);">
          <button class="update-modal__close" type="button" :aria-label="t('app.close')" @click="updateModalOpen = false">
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
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
  display: flex;
  align-items: center;
  text-decoration: none;
  color: var(--text-muted);
  padding: 0 0.25rem;
  line-height: 1;
  transition: color 0.15s;
}
.back-button:hover {
  color: var(--text-primary);
}
.back-button svg {
  width: 18px;
  height: 18px;
}

.page-transition-wrapper {
  flex: 1;
  overflow-y: auto;
}

.page-enter-active,
.page-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.page-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.page-leave-to {
  opacity: 0;
  transform: translateY(-4px);
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
  border-right: 1px solid var(--glass-border);
  padding: 0.75rem 0;
  transition: width 0.25s cubic-bezier(0.4, 0, 0.2, 1);
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
  transition: background 0.2s, color 0.2s;
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
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 24px;
  height: 24px;
}

.nav-link__icon :deep(svg) {
  width: 20px;
  height: 20px;
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
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  padding: 0.5rem;
  margin: 0.5rem;
  border-radius: var(--radius-sm);
  font-size: var(--fs-sm);
  transition: background 0.2s, color 0.2s;
}

.sidebar-toggle:hover {
  background: var(--ghost-bg);
  color: var(--text-primary);
}

.sidebar-toggle svg {
  width: 18px;
  height: 18px;
  transition: transform 0.2s ease;
}

.sidebar[data-collapsed='true'] .sidebar-toggle svg {
  transform: rotate(180deg);
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
  animation: fade-in 0.15s ease;
}

.update-modal {
  position: relative;
  width: 480px;
  max-width: 90vw;
  max-height: 80vh;
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  animation: scale-in 0.2s ease;
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
  transition: background 0.15s, color 0.15s;
}

.update-modal__close svg { width: 16px; height: 16px; }
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
