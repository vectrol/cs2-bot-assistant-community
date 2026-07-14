<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'

import ConsolePanel from '@/components/layout/ConsolePanel.vue'
import CopyButton from '@/components/CopyButton.vue'
import MetricTile from '@/components/ui/MetricTile.vue'
import InlineNotice from '@/components/ui/InlineNotice.vue'
import { appConfig } from '@/config/app'
import { teamPresets } from '@/features/cs2/data'
import { useCs2Store } from '@/stores/cs2'
import { useUiPreferencesStore } from '@/stores/ui-preferences'
import type { DifficultyPreset, GameModePreset } from '@/types/cs2'

const store = useCs2Store()
const preferences = useUiPreferencesStore()

const teamQuery = ref('')
const localMessage = ref('')
const currentResourcePackageLabel = computed(() => `当前 ${appConfig.appVersion} 资源包`)
const currentCommandsTxtLabel = computed(() => `${appConfig.appVersion} Commands.txt`)

const modeOptions: Array<{ label: string; value: GameModePreset; detail: string }> = [
  { label: 'Bot 模式', value: 'withBots', detail: '加载本地插件练习，Steam 启动项需要 -insecure。' },
  { label: '在线模式', value: 'online', detail: '恢复正常联机，切换后删除 -insecure。' },
]

const difficultyOptions: Array<{ label: string; value: DifficultyPreset; detail: string }> = [
  { label: '低', value: 'low', detail: '适合热身和新手。' },
  { label: '中', value: 'medium', detail: '接近默认训练强度。' },
  { label: '高', value: 'high', detail: '更适合高强度练枪。' },
]

const aimPresets = [
  { label: '混合', command: 'bot_aim mixed', detail: '根据局势选择瞄准位置。' },
  { label: '头部', command: 'bot_aim head', detail: '优先瞄准头部。' },
  { label: '身体', command: 'bot_aim body', detail: '优先瞄准身体。' },
]

const nadePresets = [
  { label: '正常', command: 'bot_nades normal', detail: '接近真人限制。' },
  { label: '更多', command: 'bot_nades more', detail: '推荐训练档。' },
  { label: '最大', command: 'bot_nades max', detail: '更频繁投掷。' },
  { label: '关闭', command: 'bot_nades off', detail: '完全禁用 Bot 投掷物。' },
]

const knifePresets = [
  { label: '热门五刀', command: 'lbtv_knife_hot', detail: '爪子、蝴蝶、锯齿、M9 和刺刀。' },
  { label: '轮换五刀', command: 'lbtv_knife_rdm', detail: '每次切换到下一组五刀。' },
  { label: '全部刀具', command: 'lbtv_knife_all', detail: '使用旧版全部刀具模板。' },
  { label: '生成刀具', command: 'lbtv_knife_spawn', detail: '执行当前绑定的生成命令。' },
]

const botItemNotes = computed(() => [
  { label: 'Skins', detail: '武器皮肤、刀和手套由 CounterStrikeSharp 物品插件提供。' },
  { label: 'Profiles', detail: 'Bot 头像与资料能力来自 addons/BotHider。' },
  { label: 'Agents', detail: `探员模型由${currentResourcePackageLabel.value}随插件加载。` },
  { label: 'Music', detail: '音乐盒随 Bot 物品系统加载。' },
])

const visibleTeams = computed(() => {
  const keyword = teamQuery.value.trim().toLowerCase()
  if (!keyword) {
    return teamPresets
  }
  return teamPresets.filter((team) => (
    team.name.toLowerCase().includes(keyword)
    || team.ct.toLowerCase().includes(keyword)
    || team.t.toLowerCase().includes(keyword)
  ))
})

const summaryItems = computed(() => [
  {
    label: '目录',
    value: store.selectedRoot ? '已选择' : '未选择',
    state: store.selectedRoot ? 'ready' as const : 'warn' as const,
  },
  {
    label: '安装状态',
    value: store.readyForConfig ? '可配置' : '待检查',
    state: store.readyForConfig ? 'ready' as const : 'warn' as const,
  },
  {
    label: '游戏进程',
    value: store.cs2Running ? '运行中' : '未运行',
    state: store.cs2Running ? 'warn' as const : 'ready' as const,
  },
  {
    label: '队伍预设',
    value: `${teamPresets.length} 支`,
    state: 'ready' as const,
  },
])

function recordCopied(label: string, command: string) {
  preferences.recordCommand(command, label)
  localMessage.value = `已复制：${label}`
}

function handleCopyFailed() {
  localMessage.value = '复制失败，请手动选中命令后复制。'
}

async function refreshStatus() {
  try {
    await Promise.all([
      store.refreshCs2Running(),
      store.refreshEnvironment(),
    ])
    localMessage.value = '状态已刷新。'
  } catch (error) {
    localMessage.value = store.normalizeError(error)
  }
}

async function runOneClickFlow() {
  try {
    await refreshStatus()
    if (!store.selectedRoot) {
      localMessage.value = '请先选择 CS2 根目录，再执行一键流程。'
      return
    }
    if (!store.readyForConfig) {
      localMessage.value = '环境还未就绪，请先到准备环境页完成安装。'
      return
    }
    if (store.cs2Running) {
      localMessage.value = 'CS2 正在运行。配置写入前请先退出游戏。'
      return
    }
    localMessage.value = '状态检查通过，可以切换模式、难度或复制命令。'
  } catch (error) {
    localMessage.value = store.normalizeError(error)
  }
}

async function switchMode(value: GameModePreset) {
  try {
    const result = await store.switchGameMode(value)
    localMessage.value = result.message
  } catch (error) {
    localMessage.value = store.normalizeError(error)
  }
}

async function applyDifficulty(value: DifficultyPreset) {
  try {
    const result = await store.applyDifficulty(value)
    localMessage.value = result.message
  } catch (error) {
    localMessage.value = store.normalizeError(error)
  }
}

async function launchGame() {
  try {
    await store.launchGame()
    localMessage.value = store.message
  } catch (error) {
    localMessage.value = store.normalizeError(error)
  }
}

onMounted(() => {
  preferences.load()
  if (!store.selectedRoot) {
    void store.scanRoots()
  } else {
    void refreshStatus()
  }
})
</script>

<template>
  <section class="page-grid quick-control-page">
    <section class="ops-overview">
      <ConsolePanel
        eyebrow="Live Operations"
        title="作战总览"
        :description="`模式、难度和启动走桌面端原生能力；Aim、Nades、Knife 和 Teams 按 ${currentCommandsTxtLabel} 一键复制。`"
        tone="strong"
      >
        <template #actions>
          <button class="primary-button" type="button" @click="launchGame">打开 CS2</button>
          <button class="ghost-button" type="button" :disabled="store.busy" @click="runOneClickFlow">一键检查</button>
          <button class="ghost-button" type="button" :disabled="store.busy" @click="refreshStatus">刷新</button>
        </template>
        <div class="metric-grid">
          <MetricTile
            v-for="item in summaryItems"
            :key="item.label"
            :label="item.label"
            :value="item.value"
            :state="item.state"
          />
        </div>
      </ConsolePanel>

    </section>

    <InlineNotice
      v-if="!store.selectedRoot"
      message="请先在开始使用页选择 CS2 根目录。Quick Control 会复用同一个目录和安装状态。"
      state="warn"
    />

    <div class="quick-control-grid">
      <article class="card quick-card command-panel">
        <div class="section-head">
          <div>
            <p class="eyebrow">Game Mode</p>
            <h3>Bot / Online 模式</h3>
          </div>
          <RouterLink class="ghost-button" to="/install">
            目录与安装
          </RouterLink>
        </div>
        <div class="quick-option-list">
          <button
            v-for="option in modeOptions"
            :key="option.value"
            class="quick-option"
            type="button"
            :disabled="!store.selectedRoot || store.busy"
            @click="switchMode(option.value)"
          >
            <strong>{{ option.label }}</strong>
            <span>{{ option.detail }}</span>
          </button>
        </div>
      </article>

      <article class="card quick-card command-panel">
        <div class="section-head">
          <div>
            <p class="eyebrow">Difficulty</p>
            <h3>Bot 难度</h3>
          </div>
        </div>
        <div class="quick-option-list">
          <button
            v-for="option in difficultyOptions"
            :key="option.value"
            class="quick-option"
            type="button"
            :disabled="!store.selectedRoot || store.busy"
            @click="applyDifficulty(option.value)"
          >
            <strong>{{ option.label }}</strong>
            <span>{{ option.detail }}</span>
          </button>
        </div>
      </article>

      <article class="card quick-card command-panel">
        <div class="section-head">
          <div>
            <p class="eyebrow">Presets</p>
            <h3>Aim / Nades</h3>
          </div>
        </div>
        <div class="preset-section">
          <p class="muted">Aim</p>
          <div class="quick-chip-grid">
            <CopyButton
              v-for="preset in aimPresets"
              :key="preset.command"
              :text="preset.command"
              :label="preset.label"
              copied-label="已复制"
              :copy-without-semicolon="false"
              @copied="recordCopied(preset.label, preset.command)"
              @failed="handleCopyFailed"
            />
          </div>
        </div>
        <div class="preset-section">
          <p class="muted">Nades</p>
          <div class="quick-chip-grid">
            <CopyButton
              v-for="preset in nadePresets"
              :key="preset.command"
              :text="preset.command"
              :label="preset.label"
              copied-label="已复制"
              :copy-without-semicolon="false"
              @copied="recordCopied(preset.label, preset.command)"
              @failed="handleCopyFailed"
            />
          </div>
        </div>
      </article>

      <article class="card quick-card command-panel">
        <div class="section-head">
          <div>
            <p class="eyebrow">Drop Knives</p>
            <h3>刀具模板</h3>
          </div>
        </div>
        <div class="quick-option-list">
          <div v-for="preset in knifePresets" :key="preset.command" class="quick-copy-row">
            <div>
              <strong>{{ preset.label }}</strong>
              <span>{{ preset.detail }}</span>
            </div>
            <CopyButton
              :text="preset.command"
              label="复制"
              :copy-without-semicolon="false"
              @copied="recordCopied(preset.label, preset.command)"
              @failed="handleCopyFailed"
            />
          </div>
        </div>
      </article>

      <article class="card quick-card">
        <div class="section-head">
          <div>
            <p class="eyebrow">Bot Items</p>
            <h3>物品能力状态</h3>
          </div>
          <RouterLink class="ghost-button" to="/guide">
            手动说明
          </RouterLink>
        </div>
        <div class="bot-item-grid">
          <div v-for="item in botItemNotes" :key="item.label" class="bot-item-note">
            <strong>{{ item.label }}</strong>
            <span>{{ item.detail }}</span>
          </div>
        </div>
        <p class="tip-box">
          {{ currentResourcePackageLabel }}已包含 BotHider、RayTrace、BotHiderImpl、RayTraceImpl 和 RoundDamageRecap。当前助手负责整包安装和状态检查；单项开关仍按上游 core.json / 目录重命名模型保守处理。
        </p>
      </article>

      <article class="card quick-card quick-card--wide">
        <div class="section-head">
          <div>
            <p class="eyebrow">Teams</p>
            <h3>职业队伍预设</h3>
          </div>
          <RouterLink class="ghost-button" to="/commands?tab=teams">
            去指令中心
          </RouterLink>
        </div>

        <label class="field search-field">
          <span>搜索队伍或队员</span>
          <input v-model="teamQuery" type="search" placeholder="例如 Vitality、donk、TYLOO" />
        </label>

        <div class="team-preset-grid">
          <article v-for="team in visibleTeams" :key="team.name" class="team-preset-card">
            <strong>{{ team.name }}</strong>
            <div class="actions-row">
              <CopyButton
                :text="team.ct"
                label="复制 CT"
                :copy-without-semicolon="true"
                @copied="recordCopied(`${team.name} CT`, team.ct)"
                @failed="handleCopyFailed"
              />
              <CopyButton
                :text="team.t"
                label="复制 T"
                :copy-without-semicolon="true"
                @copied="recordCopied(`${team.name} T`, team.t)"
                @failed="handleCopyFailed"
              />
            </div>
          </article>
        </div>
      </article>
    </div>

    <InlineNotice
      v-if="localMessage"
      :message="localMessage"
      :state="localMessage.includes('失败') || localMessage.includes('请先') ? 'warn' : 'info'"
    />
  </section>
</template>
