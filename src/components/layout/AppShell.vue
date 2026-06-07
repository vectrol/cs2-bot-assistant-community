<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { RouterLink, RouterView, useRoute } from 'vue-router'

import { appConfig } from '@/config/app'
import LaunchGameModal from '@/components/LaunchGameModal.vue'
import WindowControls from '@/components/layout/WindowControls.vue'

const THEME_STORAGE_KEY = appConfig.themeStorageKey

const route = useRoute()
const launchGameModalOpen = ref(false)
const theme = ref<'dark' | 'light'>('dark')
const appWindow = '__TAURI_INTERNALS__' in window ? getCurrentWindow() : null

const navItems = [
  { label: '安装检查', to: '/install', description: '选择 CS2 目录并完成安装前检查' },
  { label: '游戏设置', to: '/config', description: '切换 Bot 难度、游戏模式和插件配置' },
  { label: '常用指令', to: '/commands', description: '查看并复制常用控制台命令' },
  { label: '我的指令', to: '/custom-commands', description: '保存自己的常用控制台命令' },
  { label: 'Major 预测', to: '/major', description: '记录队伍、瑞士轮和淘汰赛预测结果' },
  { label: '使用帮助', to: '/guide', description: '查看补充说明和手动操作提示' },
  { label: '更新日志', to: '/release-notes', description: '查看每个版本的主要变化' },
]

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

onMounted(() => {
  const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY)
  if (savedTheme === 'dark' || savedTheme === 'light') {
    applyTheme(savedTheme)
    return
  }

  const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches
  applyTheme(prefersLight ? 'light' : 'dark')
})

watch(theme, (nextTheme) => {
  document.documentElement.style.colorScheme = nextTheme
})
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
            集中完成安装、环境检查、模式切换、常用指令和帮助说明。所有写入游戏目录的操作都会先检查 CS2 是否正在运行。
          </p>
        </div>

        <nav class="nav">
          <RouterLink
            v-for="item in navItems"
            :key="item.to"
            :to="item.to"
            class="nav-link"
          >
            <span>{{ item.label }}</span>
            <small>{{ item.description }}</small>
          </RouterLink>
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
            <p class="eyebrow">当前页面</p>
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
