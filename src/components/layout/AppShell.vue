<script setup lang="ts">
import { computed, onMounted, provide, ref, watch } from 'vue'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { RouterLink, RouterView, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'

import { appConfig } from '@/config/app'
import { getIcon } from '@/constants/icons'
import LaunchGameModal from '@/components/LaunchGameModal.vue'
import WindowControls from '@/components/layout/WindowControls.vue'
import { useThemePreference } from '@/composables/useThemePreference'
import { useUiPreferencesStore } from '@/stores/ui-preferences'

const route = useRoute()
const preferences = useUiPreferencesStore()
const { initializeTheme } = useThemePreference()
const { t } = useI18n()
const launchGameModalOpen = ref(false)
const sidebarCollapsed = ref(false)
const appWindow = '__TAURI_INTERNALS__' in window ? getCurrentWindow() : null

provide('openLaunchGameModal', () => {
  launchGameModalOpen.value = true
})

const navItems = computed(() => [
  { label: t('nav.quickControl'), to: '/quick-control', icon: 'play' },
  { label: t('nav.inventory'), to: '/inventory', icon: 'grid' },
  { label: t('nav.commands'), to: '/commands', icon: 'terminal' },

  { label: t('nav.guideHelp'), to: '/guide', icon: 'help' },
  { label: t('nav.settings'), to: '/settings', icon: 'sliders' },
  { label: t('nav.plugins'), to: '/plugins', icon: 'plugins' },

  { label: t('nav.matchHistory'), to: '/match-history', icon: 'history' },
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

onMounted(() => {
  preferences.load()
  initializeTheme()
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

        <button class="sidebar-toggle" type="button" :aria-label="t('nav.quickControl')" @click="sidebarCollapsed = !sidebarCollapsed">
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


  </div>
</template>

<style scoped>
.back-button {
  display: flex;
  align-items: center;
  text-decoration: none;
  color: var(--muted-color);
  padding: 0 0.25rem;
  line-height: 1;
  transition: color 0.15s;
}
.back-button:hover {
  color: var(--text-color);
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
  transition: opacity calc(0.2s * var(--anim-speed, 1)) var(--ease-out),
              transform calc(0.2s * var(--anim-speed, 1)) var(--ease-out);
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
  color: var(--muted-color);
  font-size: var(--fs-sm);
  transition: background 0.2s, color 0.2s;
}

.nav-link:hover {
  background: var(--ghost-bg);
  color: var(--text-color);
}

.nav-link.active {
  background: color-mix(in srgb, var(--color-accent) 12%, transparent);
  color: var(--color-accent);
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
  color: var(--muted-color);
  cursor: pointer;
  padding: 0.5rem;
  margin: 0.5rem;
  border-radius: var(--radius-sm);
  font-size: var(--fs-sm);
  transition: background 0.2s, color 0.2s;
}

.sidebar-toggle:hover {
  background: var(--ghost-bg);
  color: var(--text-color);
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


</style>
