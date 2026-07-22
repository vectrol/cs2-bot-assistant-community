<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'

import { appConfig } from '@/config/app'
import { useThemePreference } from '@/composables/useThemePreference'
import { disableAutostart, enableAutostart, isAutostartEnabled } from '@/services/tauri/autostart'
import { openExternalUrl } from '@/services/tauri/app'
import { useUiPreferencesStore } from '@/stores/ui-preferences'
import { saveLocale } from '@/app/i18n'

const preferences = useUiPreferencesStore()
const { locale } = useI18n()
const { theme, themeLabel, accentHue, applyTheme, setAccent, initializeTheme } = useThemePreference()
const autostartEnabled = ref(false)
const autostartLoading = ref(false)
const autostartMessage = ref('')
const sourceMessage = ref('')
const isDesktopRuntime = '__TAURI_INTERNALS__' in window

const autoInstallStatusLabel = computed(() => {
  const status = preferences.lastAutoInstall.status
  if (status === 'checking') {
    return '检查中'
  }
  if (status === 'installed') {
    return '已自动安装'
  }
  if (status === 'skipped') {
    return '已跳过'
  }
  if (status === 'failed') {
    return '失败'
  }
  return '未检查'
})

async function syncAutostart() {
  if (!isDesktopRuntime) {
    autostartMessage.value = '当前是网页预览环境，开机自启动只在桌面版里可用。'
    return
  }

  autostartLoading.value = true
  try {
    autostartEnabled.value = await isAutostartEnabled()
    autostartMessage.value = autostartEnabled.value ? '已读取系统状态：开机自启动已开启。' : '已读取系统状态：开机自启动未开启。'
  } catch (error) {
    autostartMessage.value = normalizeError(error)
  } finally {
    autostartLoading.value = false
  }
}

async function setAutostart(enabled: boolean) {
  if (!isDesktopRuntime) {
    autostartMessage.value = '当前是网页预览环境，无法修改开机自启动。'
    return
  }

  autostartLoading.value = true
  try {
    if (enabled) {
      await enableAutostart()
    } else {
      await disableAutostart()
    }
    autostartEnabled.value = await isAutostartEnabled()
    autostartMessage.value = autostartEnabled.value ? '开机自启动已开启。' : '开机自启动已关闭。'
  } catch (error) {
    autostartMessage.value = normalizeError(error)
    autostartEnabled.value = await isAutostartEnabled().catch(() => autostartEnabled.value)
  } finally {
    autostartLoading.value = false
  }
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

async function openSource(url: string) {
  try {
    await openExternalUrl(url)
    sourceMessage.value = ''
  } catch (error) {
    sourceMessage.value = normalizeError(error)
  }
}

onMounted(() => {
  preferences.load()
  initializeTheme()
  void syncAutostart()
})
</script>

<template>
  <section class="page-grid settings-page">
    <article class="hero-banner settings-hero">
      <div>
        <p class="eyebrow">系统设置</p>
        <h3>把外观、启动行为和储存说明集中到这里。</h3>
        <p class="muted">
          当前版本 v{{ appConfig.appVersion }}，储存位置暂时不能在程序里修改。
        </p>
      </div>
      <div class="settings-hero__actions">
      </div>
    </article>

    <article class="panel settings-section">
      <div class="section-heading">
        <div>
          <p class="eyebrow">外观</p>
          <h3>主题与配色</h3>
        </div>
        <span class="status-pill" data-state="info">
          {{ theme === 'dark' ? '深色' : '亮色' }}
        </span>
      </div>
      <div class="segmented-control" aria-label="主题模式">
        <button :data-active="theme === 'dark'" type="button" @click="applyTheme('dark')">深色</button>
        <button :data-active="theme === 'light'" type="button" @click="applyTheme('light')">亮色</button>
      </div>
      <div class="accent-picker">
        <p class="eyebrow">自定义主色调</p>
        <div class="accent-row">
          <input
            type="range"
            :value="accentHue"
            min="0"
            max="360"
            class="accent-slider"
            @input="setAccent(Number(($event.target as HTMLInputElement).value))"
          />
          <span class="accent-swatch" :style="{ background: `hsl(${accentHue},85%,55%)` }" />
        </div>
      </div>

      <div class="accent-picker">
        <p class="eyebrow">语言 / Language</p>
        <div class="segmented-control" aria-label="语言">
          <button
            :data-active="locale === 'zh-CN'"
            type="button"
            @click="locale = 'zh-CN'; saveLocale('zh-CN')"
          >中文</button>
          <button
            :data-active="locale === 'en-US'"
            type="button"
            @click="locale = 'en-US'; saveLocale('en-US')"
          >English</button>
        </div>
      </div>
    </article>

    <article class="panel settings-section">
      <div class="section-heading">
        <div>
          <p class="eyebrow">启动</p>
          <h3>程序行为</h3>
        </div>
        <button class="ghost-button" type="button" :disabled="autostartLoading" @click="syncAutostart">
          重新读取
        </button>
      </div>

      <div class="settings-toggle-row">
        <div>
          <strong>开机自启动</strong>
          <p class="muted">默认关闭。开启后，Windows 登录时会自动启动本助手。</p>
        </div>
        <button
          class="switch-button"
          type="button"
          role="switch"
          :aria-checked="autostartEnabled"
          :disabled="autostartLoading || !isDesktopRuntime"
          @click="setAutostart(!autostartEnabled)"
        >
          <span />
        </button>
      </div>

      <div class="settings-toggle-row">
        <div>
          <strong>新版本插件包初次安装</strong>
          <p class="muted">
            默认开启。每个应用版本最多尝试一次；检测到 CS2 正在运行或没有目录时会跳过。
          </p>
          <p class="settings-inline-status">
            {{ autoInstallStatusLabel }}：{{ preferences.lastAutoInstall.message }}
          </p>
        </div>
        <button
          class="switch-button"
          type="button"
          role="switch"
          :aria-checked="preferences.autoInstallOnFirstRunEnabled"
          @click="preferences.setAutoInstallOnFirstRunEnabled(!preferences.autoInstallOnFirstRunEnabled)"
        >
          <span />
        </button>
      </div>

      <p class="muted">{{ autostartMessage }}</p>
    </article>

    <article class="panel settings-section settings-storage">
      <div class="section-heading">
        <div>
          <p class="eyebrow">储存与隐私</p>
          <h3>储存与隐私说明</h3>
        </div>
      </div>

      <div class="storage-list">
        <section>
          <strong>浏览器缓存 / localStorage</strong>
          <p>用于记住你的使用习惯和已选择目录，包括主题、更新日志已读状态、更新提醒忽略状态、固定命令、最近命令、最近选择的 CS2 目录、页面提示是否已关闭，以及本页的新版本初次安装开关。</p>
        </section>
        <section>
          <strong>你选择的 CS2 目录</strong>
          <p>插件包会安装到游戏目录下，例如 <code>game\csgo\addons\counterstrikesharp\...</code> 和 <code>game\csgo\addons\metamod\...</code>。</p>
        </section>
        <section>
          <strong>插件配置目录</strong>
          <p>BotTaunt、NadeSystem 等配置保存在 CS2 插件配置目录里。每次安装都会清理旧插件包和插件配置，并写入内置整包。</p>
        </section>
        <section>
          <strong>运行日志 / 诊断信息</strong>
          <p>诊断功能会提供日志位置，并可打开日志目录；设置页只说明位置用途，不修改日志目录。</p>
        </section>
      </div>

      <p class="settings-storage__notice">不会上传这些本地偏好；插件配置仍保存在你选择的 CS2 目录里，相关位置暂时不能在程序里修改。</p>
    </article>

    <article class="panel settings-section">
      <div class="section-heading">
        <div>
          <p class="eyebrow">版本记录</p>
          <h3>当前版本 v{{ appConfig.appVersion }}</h3>
        </div>
        <RouterLink class="ghost-button" to="/release-notes">
          查看更新日志
        </RouterLink>
      </div>
      <p class="muted">更新日志会优先展示当前内置版本，并在网络可用时合并线上历史记录和下载入口。</p>
      <div class="open-source-attribution">
        <p>内置人机资源基于 CS2-Bot-Improver 及 CS2-Bot-Improver-Plus 的公开项目构建；本助手遵循 AGPL-3.0-or-later 发布。</p>
        <div>
          <button type="button" @click="openSource('https://github.com/ed0ard/CS2-Bot-Improver')">CS2-Bot-Improver</button>
          <button type="button" @click="openSource('https://github.com/numakkiyu/CS2-Bot-Improver-Plus')">CS2-Bot-Improver-Plus</button>
        </div>
        <small v-if="sourceMessage">{{ sourceMessage }}</small>
      </div>
    </article>
  </section>
</template>
