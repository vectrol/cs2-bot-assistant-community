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
  resourceInfo,
  checkForUpdates,
  checkResourceUpdates,
  isDismissed,
  dismissVersion,
} = useUpdateChecker()
const launchGameModalOpen = ref(false)
const updateModalOpen = ref(false)
const appWindow = '__TAURI_INTERNALS__' in window ? getCurrentWindow() : null

provide('openLaunchGameModal', () => {
  launchGameModalOpen.value = true
})

const navGroups = computed(() => [
  {
    label: t('nav.control'),
    items: [
      { label: t('nav.quickControl'), to: '/quick-control', description: t('nav.quickControl') },
      { label: t('nav.inventory'), to: '/inventory', description: t('nav.inventory') },
      { label: t('nav.commands'), to: '/commands', description: t('nav.commands') },
    ],
  },
  {
    label: t('nav.config'),
    items: [
      { label: t('nav.configConsole'), to: '/config', description: t('nav.configConsole') },
    ],
  },
  {
    label: t('nav.guide'),
    items: [
      { label: t('nav.guideHelp'), to: '/guide', description: t('nav.guideHelp') },
    ],
  },
  {
    label: t('nav.system'),
    items: [
      { label: t('nav.settings'), to: '/settings', description: t('nav.settings') },
    ],
  },
])

const pageDescription = computed(
  () => navGroups.value.flatMap((g) => g.items).find((item) => item.to === route.path)?.description ?? appConfig.appName,
)

const pageTitle = computed(
  () => navGroups.value.flatMap((g) => g.items).find((item) => item.to === route.path)?.label ?? String(route.name ?? appConfig.appName),
)
async function startWindowDrag(event: MouseEvent) {
  if (event.button !== 0 || event.detail > 1) {
    return
  }

  if (!appWindow) {
    return
  }

  try {
    await appWindow.startDragging()
  } catch (error) {
    console.error('start window dragging failed', error)
  }
}

async function toggleWindowMaximize() {
  if (!appWindow) {
    return
  }

  try {
    await appWindow.toggleMaximize()
  } catch (error) {
    console.error('toggle maximize window failed', error)
  }
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
  void checkResourceUpdates()
})

watch(
  () => route.fullPath,
  (routePath) => {
    preferences.setLastRoute(routePath)
  },
  { immediate: true },
)
</script>

<template>
  <div class="app-chrome">
    <header class="app-titlebar">
      <div class="app-titlebar-brand" @mousedown="startWindowDrag" @dblclick="toggleWindowMaximize">
        <span>{{ appConfig.appName }}</span>
        <small>v{{ appConfig.appVersion }}</small>
      </div>

      <div class="app-titlebar-drag" aria-hidden="true" @mousedown="startWindowDrag" @dblclick="toggleWindowMaximize" />

      <WindowControls />
    </header>

    <div class="shell chrome-shell">
      <aside class="sidebar">
        <div class="brand-panel">
          <p class="eyebrow">{{ t('app.brandLabel') }}</p>
          <div class="brand-title-row">
            <h1>{{ t('app.name') }}</h1>
            <span class="version-badge">{{ t('app.version') }} v{{ appConfig.appVersion }}</span>
          </div>
          <p class="muted">
            {{ t('guide.title') }}
          </p>
        </div>

        <nav class="nav">
          <section v-for="group in navGroups" :key="group.label" class="nav-group">
            <p class="nav-group__label">{{ group.label }}</p>
            <RouterLink
              v-for="item in group.items"
              :key="item.to"
              :to="item.to"
              class="nav-link"
            >
              <span>{{ item.label }}</span>
              <small>{{ item.description }}</small>
            </RouterLink>
          </section>
        </nav>

        <div class="sidebar-card sidebar-card--compact">
          <p class="eyebrow">{{ t('app.cs2Running') }}</p>
          <strong>{{ t('guide.environmentReady') }}</strong>
          <p class="muted">{{ t('guide.installPackageHint') }}</p>
        </div>

        <a
          v-if="resourceInfo"
          :href="resourceInfo.htmlUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="sidebar-card sidebar-card--resource"
        >
          <p class="eyebrow">{{ t('update.resourceUpdate') }}</p>
          <strong>{{ resourceInfo.title }}</strong>
          <p class="muted">v{{ resourceInfo.currentVersion }} → v{{ resourceInfo.upstreamVersion }}</p>
        </a>

      </aside>

      <main class="content">
        <header class="titlebar console-titlebar">
          <div class="titlebar-main">
            <p class="eyebrow">{{ t('quickControl.title') }}</p>
            <h2>{{ pageTitle }}</h2>
            <p class="muted">{{ pageDescription }}</p>
          </div>

          <div class="titlebar-actions">
            <button class="ghost-button" type="button" :disabled="store.busy" @click="refreshGlobalStatus">
              {{ t('app.refresh') }}
            </button>
            <button class="primary-button" type="button" @click="launchGameModalOpen = true">
              {{ t('app.openCs2') }}
            </button>
          </div>
        </header>

        <GlobalStatusBar />

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
              <a
                v-if="updateInfo.downloadUrl"
                :href="updateInfo.downloadUrl"
                class="primary-button"
                target="_blank"
                rel="noopener noreferrer"
              >{{ t('update.download') }}</a>
              <a
                :href="updateInfo.htmlUrl"
                class="ghost-button"
                target="_blank"
                rel="noopener noreferrer"
              >{{ t('update.viewOnGithub') }}</a>
              <button
                class="ghost-button"
                type="button"
                @click="dismissVersion(updateInfo.latestVersion); updateModalOpen = false"
              >{{ t('update.remindLater') }}</button>
            </div>
          </div>
        </article>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
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

.update-modal__close svg {
  width: 16px;
  height: 16px;
  stroke: currentColor;
  stroke-width: 2;
  fill: none;
}

.update-modal__close:hover {
  background: var(--ghost-bg);
  color: var(--text-primary);
}

.update-modal__content {
  padding: 1.5rem;
  overflow-y: auto;
}

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

.update-modal__actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
  flex-wrap: wrap;
}

.sidebar-card--resource {
  display: block;
  text-decoration: none;
  cursor: pointer;
  border-color: var(--accent);
  transition: opacity 0.15s;
}

.sidebar-card--resource:hover {
  opacity: 0.85;
}
</style>
