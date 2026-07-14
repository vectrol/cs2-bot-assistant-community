<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { RouterLink, RouterView, useRoute } from 'vue-router'

import { appConfig } from '@/config/app'
import GlobalStatusBar from '@/components/layout/GlobalStatusBar.vue'
import LaunchGameModal from '@/components/LaunchGameModal.vue'
import WindowControls from '@/components/layout/WindowControls.vue'
import { useThemePreference } from '@/composables/useThemePreference'
import { useCs2Store } from '@/stores/cs2'
import { useUiPreferencesStore } from '@/stores/ui-preferences'

const route = useRoute()
const store = useCs2Store()
const preferences = useUiPreferencesStore()
const { initializeTheme } = useThemePreference()
const launchGameModalOpen = ref(false)
const appWindow = '__TAURI_INTERNALS__' in window ? getCurrentWindow() : null

const navGroups = [
  {
    label: '准备',
    items: [
      { label: '准备环境', to: '/install', description: '目录、安装、安全确认' },
    ],
  },
  {
    label: '控制',
    items: [
      { label: '作战总览', to: '/quick-control', description: '模式、难度、启动和常用命令' },
      { label: '指令库', to: '/commands', description: '搜索、复制和固定命令' },
      { label: '我的指令', to: '/custom-commands', description: '维护本地自定义命令' },
    ],
  },
  {
    label: '配置',
    items: [
      { label: '配置控制台', to: '/config', description: 'AI、嘲讽、投掷物和 Demo' },
    ],
  },
  {
    label: '资料',
    items: [
      { label: '使用帮助', to: '/guide', description: '启动项、诊断和常见问题' },
      { label: '官网意见', to: '/official-site', description: '浏览官网、意见区和更新信息' },
    ],
  },
  {
    label: '系统',
    items: [
      { label: '设置', to: '/settings', description: '外观、启动、官网和储存说明' },
    ],
  },
]

const navItems = navGroups.flatMap((group) => group.items)
const isOfficialSiteRoute = computed(() => route.name === 'official-site')

const pageDescription = computed(
  () => navItems.find((item) => item.to === route.path)?.description ?? appConfig.appName,
)

const pageTitle = computed(
  () => navItems.find((item) => item.to === route.path)?.label ?? String(route.name ?? appConfig.appName),
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

onMounted(() => {
  preferences.load()
  initializeTheme()
  void refreshGlobalStatus()
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
  <div class="app-chrome" :class="{ 'app-chrome--official': isOfficialSiteRoute }">
    <header class="app-titlebar">
      <div class="app-titlebar-brand" @mousedown="startWindowDrag" @dblclick="toggleWindowMaximize">
        <span>{{ appConfig.appName }}</span>
        <small>v{{ appConfig.appVersion }}</small>
      </div>

      <nav v-if="isOfficialSiteRoute" class="official-app-nav" aria-label="应用页面导航">
        <RouterLink class="official-app-nav__link official-app-nav__link--primary" to="/install">
          返回准备环境
        </RouterLink>
        <RouterLink class="official-app-nav__link" to="/quick-control">
          作战总览
        </RouterLink>
        <RouterLink class="official-app-nav__link" to="/settings">
          设置
        </RouterLink>
      </nav>

      <div class="app-titlebar-drag" aria-hidden="true" @mousedown="startWindowDrag" @dblclick="toggleWindowMaximize" />

      <WindowControls />
    </header>

    <div class="shell chrome-shell">
      <aside v-if="!isOfficialSiteRoute" class="sidebar">
        <div class="brand-panel">
          <p class="eyebrow">{{ appConfig.appBrandLabel }}</p>
          <div class="brand-title-row">
            <h1>{{ appConfig.appName }}</h1>
            <span class="version-badge">v{{ appConfig.appVersion }}</span>
          </div>
          <p class="muted">
            CS2 人机增强训练控制台
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
          <p class="eyebrow">安全边界</p>
          <strong>写入前退出 CS2</strong>
          <p class="muted">安装、模式、难度和插件配置都会先受运行状态约束。</p>
        </div>

      </aside>

      <main class="content">
        <header v-if="!isOfficialSiteRoute" class="titlebar console-titlebar">
          <div class="titlebar-main">
            <p class="eyebrow">任务面板</p>
            <h2>{{ pageTitle }}</h2>
            <p class="muted">{{ pageDescription }}</p>
          </div>

          <div class="titlebar-actions">
            <button class="ghost-button" type="button" :disabled="store.busy" @click="refreshGlobalStatus">
              刷新状态
            </button>
            <button class="primary-button" type="button" @click="launchGameModalOpen = true">
              打开 CS2
            </button>
          </div>
        </header>

        <GlobalStatusBar v-if="!isOfficialSiteRoute" />

        <RouterView />
      </main>
    </div>
    <LaunchGameModal :open="launchGameModalOpen" @close="launchGameModalOpen = false" />
  </div>
</template>
