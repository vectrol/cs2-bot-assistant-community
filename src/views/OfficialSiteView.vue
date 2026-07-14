<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { listen, type UnlistenFn } from '@tauri-apps/api/event'
import { useRoute } from 'vue-router'

import {
  goBackOfficialSite,
  goForwardOfficialSite,
  hideOfficialSite,
  navigateOfficialSite,
  reloadOfficialSite,
  setOfficialSiteBounds,
  showOfficialSite,
  type OfficialSiteBounds,
} from '@/services/tauri/official-site'

const officialOrigin = 'https://cs2as.600318.xyz'
const ideaUrl = `${officialOrigin}/idea`
const homeUrl = `${officialOrigin}/`
const isDesktopRuntime = '__TAURI_INTERNALS__' in window
const route = useRoute()

function isAllowedOfficialPath(pathname: string) {
  return pathname === '/' || pathname === '/idea' || pathname === '/rizhi' || pathname === '/commands'
    || /^\/commands\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(pathname)
}

const requestedPath = typeof route.query.path === 'string' && isAllowedOfficialPath(route.query.path)
  ? route.query.path
  : '/idea'
const initialUrl = `${officialOrigin}${requestedPath === '/' ? '/' : requestedPath}`

const viewportRef = ref<HTMLElement | null>(null)
const currentUrl = ref(initialUrl)
const addressInput = ref(initialUrl)
const navigationMessage = ref('正在打开 CS2AS 官网，请等待。')
const loading = ref(true)
const blockedUrl = ref('')
const nativeReady = ref(false)

let resizeObserver: ResizeObserver | null = null
let resizeFrame = 0
let unlistenBlocked: UnlistenFn | null = null
let unlistenLoadState: UnlistenFn | null = null
let unlistenExternalOpen: UnlistenFn | null = null

const currentHostLabel = computed(() => new URL(currentUrl.value).host)
const statusState = computed(() => {
  if (!isDesktopRuntime || blockedUrl.value) {
    return 'warn'
  }
  return loading.value ? 'info' : 'ready'
})
const statusLabel = computed(() => {
  if (!isDesktopRuntime) {
    return '网页预览'
  }
  if (blockedUrl.value) {
    return '已阻止'
  }
  return loading.value ? '加载中' : '已就绪'
})

function normalizeOfficialUrl(rawValue: string) {
  const value = rawValue.trim()
  const candidate = !value
    ? ideaUrl
    : value.startsWith('/')
      ? `${officialOrigin}${value}`
      : value === 'cs2as.600318.xyz'
        ? homeUrl
        : value.startsWith('cs2as.600318.xyz/')
          ? `https://${value}`
          : value

  try {
    const url = new URL(candidate)
    if (url.origin !== officialOrigin || !isAllowedOfficialPath(url.pathname)) {
      throw new Error('只能访问官网首页、意见、更新日志和指令库。')
    }
    return url.toString()
  } catch (error) {
    if (error instanceof Error && error.message === '只能访问官网首页、意见、更新日志和指令库。') {
      throw error
    }
    throw new Error('请输入允许的官网路径：/、/idea、/rizhi 或 /commands。')
  }
}

async function showNativeWebview(rawUrl = currentUrl.value) {
  if (!isDesktopRuntime) {
    loading.value = false
    navigationMessage.value = '当前是网页预览环境，官网页面会在桌面版内显示。'
    return
  }

  const bounds = getViewportBounds()
  if (!bounds) {
    return
  }

  loading.value = true
  blockedUrl.value = ''
  navigationMessage.value = '正在打开 CS2AS 官网，请等待。'

  try {
    const normalizedUrl = normalizeOfficialUrl(rawUrl)
    const loadedUrl = await showOfficialSite(normalizedUrl, bounds)
    nativeReady.value = true
    currentUrl.value = loadedUrl
    addressInput.value = loadedUrl
  } catch (error) {
    loading.value = false
    navigationMessage.value = normalizeError(error)
  }
}

async function navigateTo(rawValue: string) {
  try {
    const nextUrl = normalizeOfficialUrl(rawValue)
    loading.value = true
    blockedUrl.value = ''
    navigationMessage.value = '正在打开 CS2AS 官网，请等待。'
    addressInput.value = nextUrl

    if (!nativeReady.value) {
      await showNativeWebview(nextUrl)
      return
    }

    const loadedUrl = await navigateOfficialSite(nextUrl)
    currentUrl.value = loadedUrl
    addressInput.value = loadedUrl
  } catch (error) {
    loading.value = false
    navigationMessage.value = normalizeError(error)
    addressInput.value = currentUrl.value
  }
}

function submitAddress() {
  void navigateTo(addressInput.value)
}

function goHome() {
  void navigateTo(homeUrl)
}

function goIdea() {
  void navigateTo(ideaUrl)
}

async function reloadPage() {
  if (!isDesktopRuntime || !nativeReady.value) {
    return
  }
  loading.value = true
  navigationMessage.value = '正在刷新当前官网页面。'
  await reloadOfficialSite().catch((error) => {
    loading.value = false
    navigationMessage.value = normalizeError(error)
  })
}

async function goHistory(direction: -1 | 1) {
  if (!isDesktopRuntime || !nativeReady.value) {
    return
  }
  loading.value = true
  navigationMessage.value = direction < 0 ? '正在后退。' : '正在前进。'
  const action = direction < 0 ? goBackOfficialSite : goForwardOfficialSite
  await action().catch((error) => {
    loading.value = false
    navigationMessage.value = normalizeError(error)
  })
}

function getViewportBounds(): OfficialSiteBounds | null {
  const viewport = viewportRef.value
  if (!viewport) {
    return null
  }

  const rect = viewport.getBoundingClientRect()
  return {
    x: Math.max(0, rect.left),
    y: Math.max(0, rect.top),
    width: Math.max(1, rect.width),
    height: Math.max(1, rect.height),
  }
}

function scheduleBoundsUpdate() {
  if (!isDesktopRuntime || !nativeReady.value) {
    return
  }
  window.cancelAnimationFrame(resizeFrame)
  resizeFrame = window.requestAnimationFrame(() => {
    const bounds = getViewportBounds()
    if (!bounds) {
      return
    }
    void setOfficialSiteBounds(bounds)
  })
}

async function setupNativeEvents() {
  if (!isDesktopRuntime) {
    return
  }

  unlistenBlocked = await listen<{ url: string, reason: string }>(
    'official-site:navigation-blocked',
    (event) => {
      blockedUrl.value = event.payload.url
      loading.value = false
      navigationMessage.value = event.payload.reason
      addressInput.value = currentUrl.value
    },
  )

  unlistenLoadState = await listen<{ url: string, state: 'started' | 'finished' }>(
    'official-site:load-state',
    (event) => {
      if (event.payload.state === 'started') {
        loading.value = true
        blockedUrl.value = ''
        navigationMessage.value = '正在打开 CS2AS 官网，请等待。'
        return
      }

      currentUrl.value = event.payload.url
      addressInput.value = event.payload.url
      loading.value = false
      navigationMessage.value = `已连接 ${currentHostLabel.value}。`
    },
  )

  unlistenExternalOpen = await listen<{ url: string, host: string }>(
    'official-site:external-opened',
    (event) => {
      blockedUrl.value = ''
      loading.value = false
      navigationMessage.value = `已用系统浏览器打开 ${event.payload.host}。`
    },
  )
}

function normalizeError(error: unknown) {
  if (typeof error === 'string') {
    return error
  }
  if (error instanceof Error) {
    return error.message
  }
  return '操作失败，请稍后重试。'
}

onMounted(async () => {
  await setupNativeEvents()
  await nextTick()

  resizeObserver = new ResizeObserver(() => scheduleBoundsUpdate())
  if (viewportRef.value) {
    resizeObserver.observe(viewportRef.value)
  }
  window.addEventListener('resize', scheduleBoundsUpdate)
  window.addEventListener('scroll', scheduleBoundsUpdate, true)

  void showNativeWebview(initialUrl)
})

onBeforeUnmount(() => {
  window.cancelAnimationFrame(resizeFrame)
  resizeObserver?.disconnect()
  window.removeEventListener('resize', scheduleBoundsUpdate)
  window.removeEventListener('scroll', scheduleBoundsUpdate, true)
  unlistenBlocked?.()
  unlistenLoadState?.()
  unlistenExternalOpen?.()
  if (isDesktopRuntime) {
    void hideOfficialSite()
  }
})
</script>

<template>
  <section class="official-site-page">
    <div class="official-browser">
      <form class="official-browser__toolbar" @submit.prevent="submitAddress">
        <div class="official-browser__nav" aria-label="网页导航">
          <button class="official-icon-button" type="button" aria-label="后退" title="后退" @click="goHistory(-1)">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <button class="official-icon-button" type="button" aria-label="前进" title="前进" @click="goHistory(1)">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
          <button class="official-icon-button" type="button" aria-label="刷新" title="刷新" @click="reloadPage">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M20 12a8 8 0 1 1-2.34-5.66" />
              <path d="M20 4v6h-6" />
            </svg>
          </button>
          <button class="official-icon-button" type="button" aria-label="官网首页" title="官网首页" @click="goHome">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M3 11l9-8 9 8" />
              <path d="M5 10v10h14V10" />
              <path d="M9 20v-6h6v6" />
            </svg>
          </button>
        </div>

        <label class="official-address-field">
          <span class="sr-only">官网地址</span>
          <input
            v-model="addressInput"
            type="text"
            inputmode="url"
            spellcheck="false"
            autocomplete="off"
            aria-label="官网地址"
            placeholder="https://cs2as.600318.xyz/idea"
            @keydown.enter.prevent="submitAddress"
          />
        </label>

        <div class="official-browser__status" :data-loading="loading" aria-live="polite">
          <span class="status-pill" :data-state="statusState">
            <span class="status-pill__dot" />
            {{ statusLabel }}
          </span>
          <span>{{ navigationMessage }}</span>
          <span v-if="blockedUrl" class="official-browser__blocked-url">{{ blockedUrl }}</span>
        </div>

        <div class="official-browser__actions">
          <button class="official-icon-button" type="submit" aria-label="前往地址" title="前往地址">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M5 12h14" />
              <path d="M13 6l6 6-6 6" />
            </svg>
          </button>
          <button class="ghost-button official-return-button" type="button" @click="goIdea">
            回到意见
          </button>
        </div>
      </form>

      <div ref="viewportRef" class="official-browser__viewport">
        <div class="official-browser__native-surface" aria-hidden="true" />
        <div v-if="loading || !isDesktopRuntime" class="official-browser__loading" aria-live="polite">
          <span class="official-loading-ring" aria-hidden="true" />
          <strong>正在打开 CS2AS 官网</strong>
          <span>网络较慢时请等待。官网 WebView 只允许访问 {{ currentHostLabel }}。</span>
        </div>
      </div>
    </div>
  </section>
</template>
