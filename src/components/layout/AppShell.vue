<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { RouterLink, RouterView, useRoute } from 'vue-router'

import { appConfig } from '@/config/app'
import LaunchGameModal from '@/components/LaunchGameModal.vue'
import ReadinessPanel from '@/components/ReadinessPanel.vue'
import WindowControls from '@/components/layout/WindowControls.vue'
import { useCs2Store } from '@/stores/cs2'
import { useUiPreferencesStore } from '@/stores/ui-preferences'

const THEME_STORAGE_KEY = appConfig.themeStorageKey

const route = useRoute()
const store = useCs2Store()
const preferences = useUiPreferencesStore()
const launchGameModalOpen = ref(false)
const theme = ref<'dark' | 'light'>('dark')
const appWindow = '__TAURI_INTERNALS__' in window ? getCurrentWindow() : null

const navGroups = [
  {
    label: '主要流程',
    items: [
      { label: '开始使用', to: '/install', description: '选择目录、安装并确认启动项' },
      { label: '快速控制', to: '/quick-control', description: '模式、难度、预设和队伍' },
      { label: '游戏配置', to: '/config', description: '难度、模式和插件设置' },
      { label: '指令中心', to: '/commands', description: '搜索、分类和自定义命令' },
    ],
  },
  {
    label: '辅助功能',
    items: [
      { label: '我的指令', to: '/custom-commands', description: '打开指令中心的自定义分类' },
      { label: '使用帮助', to: '/guide', description: '常见问题和手动操作' },
      { label: '更新日志', to: '/release-notes', description: '版本变化记录' },
    ],
  },
  {
    label: '更多玩法',
    items: [
      { label: 'Major 预测', to: '/major', description: '记录赛程预测' },
    ],
  },
]

const navItems = navGroups.flatMap((group) => group.items)

const pageDescription = computed(
  () => navItems.find((item) => item.to === route.path)?.description ?? appConfig.appName,
)

const pageTitle = computed(
  () => navItems.find((item) => item.to === route.path)?.label ?? String(route.name ?? appConfig.appName),
)
const themeButtonLabel = computed(() => (theme.value === 'dark' ? '切换亮色' : '切换暗色'))

function applyTheme(nextTheme: 'dark' | 'light') {
  theme.value = nextTheme
  document.documentElement.dataset.theme = nextTheme
  window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme)
}

function toggleTheme() {
  applyTheme(theme.value === 'dark' ? 'light' : 'dark')
}

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
  const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY)
  if (savedTheme === 'dark' || savedTheme === 'light') {
    applyTheme(savedTheme)
  } else {
    const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches
    applyTheme(prefersLight ? 'light' : 'dark')
  }

  void refreshGlobalStatus()
})

watch(theme, (nextTheme) => {
  document.documentElement.style.colorScheme = nextTheme
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
          <p class="eyebrow">{{ appConfig.appBrandLabel }}</p>
          <div class="brand-title-row">
            <h1>{{ appConfig.appName }}</h1>
            <span class="version-badge">v{{ appConfig.appVersion }}</span>
          </div>
          <p class="muted">
            安装、配置和启动 CS2 人机增强包。
          </p>
        </div>

        <ReadinessPanel />

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

        <div class="sidebar-card">
          <p class="eyebrow">使用原则</p>
          <strong>不向正在运行的游戏进程写入内容</strong>
          <p class="muted">程序只负责检查、安装、配置和复制命令，避免把风险带进正在运行的 CS2。</p>
        </div>

      </aside>

      <main class="content">
        <header class="titlebar">
          <div class="titlebar-main">
            <p class="eyebrow">当前任务</p>
            <h2>{{ pageTitle }}</h2>
          </div>

          <div class="titlebar-actions">
            <p class="muted">{{ pageDescription }}</p>
            <button class="primary-button" type="button" @click="launchGameModalOpen = true">
              打开 CS2
            </button>
            <button class="theme-toggle" type="button" @click="toggleTheme">
              <span class="theme-toggle__icon">{{ theme === 'dark' ? '☀' : '☾' }}</span>
              <span>{{ themeButtonLabel }}</span>
            </button>
          </div>
        </header>

        <RouterView />
      </main>
    </div>
    <LaunchGameModal :open="launchGameModalOpen" @close="launchGameModalOpen = false" />
  </div>
</template>
