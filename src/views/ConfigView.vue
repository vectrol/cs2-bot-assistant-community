<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import ActionModal from '@/components/ActionModal.vue'
import ConfigActionGroup from '@/components/config/ConfigActionGroup.vue'
import ConfigEditorModal from '@/components/config/ConfigEditorModal.vue'
import ConfigSection from '@/components/config/ConfigSection.vue'
import ConsolePanel from '@/components/layout/ConsolePanel.vue'
import CopyButton from '@/components/CopyButton.vue'
import MetricTile from '@/components/ui/MetricTile.vue'
import { useCs2Store } from '@/stores/cs2'
import { useUiPreferencesStore } from '@/stores/ui-preferences'
import type { DifficultyPreset, GameModePreset } from '@/types/cs2'

const store = useCs2Store()
const preferences = useUiPreferencesStore()
const aiApiModalOpen = ref(false)
const botTauntModalOpen = ref(false)
const nadeRecoveryModalOpen = ref(false)
const demoDetailModalOpen = ref(false)
const activeConfigSection = ref<'base' | 'ai' | 'taunts' | 'nades' | 'demo'>('base')
const aiApiUrl = ref('')
const aiApiKey = ref('')
const botRivalryEnabled = ref(false)
const aiApiLoadedPath = ref('')
const freeAiApiKey = 'mmc_5d75635d51839386a23758f8129bf4a095c319f8f1506927'
const freeAiApiMessage = ref('')
type BotTauntTextKey =
  | 'normalTaunts'
  | 'headshotTaunts'
  | 'knifeTaunts'
  | 'botRivalryTaunts'
  | 'openingTrashTalks'
type BotTauntSingleTextKey = 'roundKillTaunt' | 'multiKillTaunt' | 'clutchTaunt' | 'saveTaunt'
const botTauntLines = ref<Record<BotTauntTextKey, string>>({
  normalTaunts: '',
  headshotTaunts: '',
  knifeTaunts: '',
  botRivalryTaunts: '',
  openingTrashTalks: '',
})
const botTauntSingleLines = ref<Record<BotTauntSingleTextKey, string>>({
  roundKillTaunt: '',
  multiKillTaunt: '',
  clutchTaunt: '',
  saveTaunt: '',
})
const botTauntLoadedPath = ref('')
const nadeRecovery = ref({
  flash: 0.55,
  smoke: 0.85,
  he: 0.65,
  molotov: 0.8,
  incgrenade: 0.8,
  decoy: 0.55,
})
const nadeRecoveryLoadedPath = ref('')

const difficultyCards: Array<{ title: string; preset: DifficultyPreset; description: string }> = [
  { title: '简单', preset: 'low', description: '适合刚开始练习，Bot 更容易应对。' },
  { title: '标准', preset: 'medium', description: '更接近日常对局，推荐大多数玩家使用。' },
  { title: '高强度', preset: 'high', description: '适合练反应、对枪和残局处理。' },
]

const modeCards: Array<{ title: string; preset: GameModePreset; description: string }> = [
  { title: '在线模式', preset: 'online', description: '准备正常进入线上比赛时使用。' },
  { title: 'Bot 模式', preset: 'withBots', description: '继续打人机或练习地图时使用。' },
]

const botTauntTextFields: Array<{ key: BotTauntTextKey; label: string; hint: string }> = [
  { key: 'normalTaunts', label: '普通击杀', hint: '普通击杀时随机发送，每行一句' },
  { key: 'headshotTaunts', label: '爆头击杀', hint: '爆头时随机发送，每行一句' },
  { key: 'knifeTaunts', label: '刀杀', hint: '刀杀时随机发送，每行一句' },
  { key: 'botRivalryTaunts', label: 'BOT 互相嘲讽', hint: 'BOT 击杀敌方 BOT 时随机发送，每行一句' },
  { key: 'openingTrashTalks', label: '开局嘲讽', hint: '回合开局随机发送，每行一句' },
]

const botTauntSingleTextFields: Array<{ key: BotTauntSingleTextKey; label: string; hint: string }> = [
  { key: 'roundKillTaunt', label: '单回合 5 杀', hint: '触发单回合 5 杀时发送' },
  { key: 'multiKillTaunt', label: '5 秒 3 杀', hint: '短时间连续击杀时发送' },
  { key: 'clutchTaunt', label: '残局', hint: '残局表现触发时发送' },
  { key: 'saveTaunt', label: '保枪', hint: '保枪场景触发时发送' },
]

const blockedReason = computed(() => {
  if (!store.selectedRoot) {
    return '请先到“安装检查”页选择游戏目录。'
  }
  if (!store.readyForConfig) {
    return '当前环境尚未就绪，请先完成安装。'
  }
  if (store.cs2Running) {
    return '检测到 CS2 正在运行，请先退出游戏。'
  }
  return ''
})

const aiConfigStatus = computed(() => {
  if (!store.aiApiConfig) {
    return '选择并安装 CS2 目录后，可以在这里修改 Bot AI 聊天 API。'
  }
  if (!store.aiApiConfig.exists) {
    return '尚未找到配置文件，保存后会自动创建 BotTaunt.json。'
  }
  return `当前配置文件：${store.aiApiConfig.configPath}`
})

const botTauntStatus = computed(() => {
  if (!store.botTauntsConfig) {
    return '选择并安装 CS2 目录后，可以在这里设置击杀嘲讽内容。'
  }
  if (!store.botTauntsConfig.exists) {
    return '尚未找到 Taunts.json，保存后会自动创建。'
  }
  return `当前配置文件：${store.botTauntsConfig.configPath}`
})

const nadeRecoveryFields = [
  { key: 'flash', label: '闪光弹', hint: 'BOT 丢出闪光后的压制秒数' },
  { key: 'smoke', label: '烟雾弹', hint: 'BOT 丢出烟雾后的压制秒数' },
  { key: 'he', label: '高爆雷', hint: 'BOT 丢出高爆后的压制秒数' },
  { key: 'molotov', label: '燃烧瓶', hint: 'T 方燃烧瓶后的压制秒数' },
  { key: 'incgrenade', label: '燃烧弹', hint: 'CT 方燃烧弹后的压制秒数' },
] as const

const nadeRecoveryStatus = computed(() => {
  if (!store.nadeRecoveryConfig) {
    return '选择并安装 CS2 目录后，可以在这里编辑 BOT 使用道具后的开火压制时间。'
  }
  if (!store.nadeRecoveryConfig.exists) {
    return '尚未找到 NadeSystem.json，保存后会自动创建。'
  }
  return `当前配置文件：${store.nadeRecoveryConfig.configPath}`
})

const recentDemo = computed(() => store.demoDiscovery?.recentDemo ?? null)

const statusItems = computed(() => [
  {
    label: '目录',
    value: store.selectedRoot ? '已选择' : '未选择',
    state: store.selectedRoot ? 'ready' as const : 'warn' as const,
  },
  {
    label: '环境',
    value: store.readyForConfig ? '可配置' : '未就绪',
    state: store.readyForConfig ? 'ready' as const : 'warn' as const,
  },
  {
    label: 'CS2',
    value: store.cs2Running ? '正在运行' : '未运行',
    state: store.cs2Running ? 'danger' as const : 'ready' as const,
  },
])

const demoStatus = computed(() => {
  if (!store.selectedRoot) {
    return '选择 CS2 目录后，可以查找最近录制的人机 Demo。'
  }
  if (!store.demoDiscovery) {
    return '尚未查找 Demo。'
  }
  if (!store.demoDiscovery.recentDemo) {
    return `没有找到 Demo 文件。默认目录：${store.demoDiscovery.defaultDirectory}`
  }
  return `最近 Demo：${store.demoDiscovery.recentDemo.fileName}`
})

const recentConfigItems = computed(() => preferences.recentActions
  .filter((item) => ['设置难度', '切换模式', '保存 AI 聊天', '保存嘲讽内容', '保存道具压制开火'].includes(item.label))
  .slice(0, 4))

const configSections = computed(() => [
  { key: 'base' as const, label: '基础配置', detail: blockedReason.value || '难度和模式可写入' },
  { key: 'ai' as const, label: 'AI 聊天', detail: store.aiApiConfig?.exists ? '已读取配置' : '可选配置' },
  { key: 'taunts' as const, label: 'Bot 嘲讽', detail: store.botTauntsConfig?.exists ? '已读取文本' : '可编辑文本' },
  { key: 'nades' as const, label: '道具压制开火', detail: store.nadeRecoveryConfig?.exists ? '已读取时间' : '可编辑时间' },
  { key: 'demo' as const, label: 'Demo / 启动项', detail: recentDemo.value?.fileName ?? '辅助操作' },
])

function canWriteConfig() {
  if (!blockedReason.value) {
    return true
  }
  store.setMessage(blockedReason.value)
  return false
}

async function applyDifficulty(preset: DifficultyPreset) {
  if (!canWriteConfig()) {
    return
  }
  try {
    preferences.createRestorePoint('设置 Bot 难度', store.selectedRoot, `应用难度预设：${preset}`, false)
    await store.applyDifficulty(preset)
    preferences.recordAction('设置难度', preset)
  } catch (error) {
    const message = store.normalizeError(error)
    preferences.recordError(message, '设置 Bot 难度')
    store.setMessage(`${message} 请先重新检查目录，并确认 CS2 已退出。`)
  }
}

async function switchMode(preset: GameModePreset) {
  if (!canWriteConfig()) {
    return
  }
  try {
    preferences.createRestorePoint('切换游戏模式', store.selectedRoot, `模式切换：${preset}`, false)
    await store.switchGameMode(preset)
    preferences.recordAction('切换模式', preset === 'online' ? '在线模式' : 'Bot 模式')
  } catch (error) {
    const message = store.normalizeError(error)
    preferences.recordError(message, '切换游戏模式')
    store.setMessage(`${message} 请先退出 CS2，再返回安装页重新检查。`)
  }
}

async function refreshAiApiConfig() {
  try {
    const config = await store.refreshAiApiConfig()
    aiApiUrl.value = config?.aiApiUrl ?? ''
    aiApiKey.value = config?.aiApiKey ?? ''
    botRivalryEnabled.value = config?.botRivalryEnabled ?? false
    aiApiLoadedPath.value = config?.configPath ?? ''
    freeAiApiMessage.value = ''
  } catch (error) {
    const message = store.normalizeError(error)
    preferences.recordError(message, '读取 AI 聊天配置')
    store.setMessage(`${message} 可以重新读取，或到帮助页复制诊断信息。`)
  }
}

function enableFreeAiApiKey() {
  if (aiApiKey.value.trim()) {
    freeAiApiMessage.value = '当前已经填写了 API Key。为了避免覆盖你的自定义 Key，请先手动清空后再启用免费 Key。'
    return
  }

  aiApiKey.value = freeAiApiKey
  freeAiApiMessage.value = '免费 Key 已填入当前表单。点击“保存 AI 聊天设置”后才会写入配置文件。'
}

async function saveAiApi() {
  if (!canWriteConfig()) {
    return false
  }
  try {
    preferences.createRestorePoint('保存 AI 聊天设置', store.selectedRoot, '写入 BotTaunt.json 的 AI API 配置', false)
    await store.saveAiApi({
      aiApiUrl: aiApiUrl.value,
      aiApiKey: aiApiKey.value,
      botRivalryEnabled: botRivalryEnabled.value,
    })
    preferences.recordAction('保存 AI 聊天', aiApiLoadedPath.value || store.selectedRoot)
    return true
  } catch (error) {
    const message = store.normalizeError(error)
    preferences.recordError(message, '保存 AI 聊天设置')
    store.setMessage(`${message} 请确认目录可写；仍失败时复制诊断信息。`)
    return false
  }
}

async function saveAiApiAndClose() {
  if (await saveAiApi()) {
    aiApiModalOpen.value = false
  }
}

async function resetAiApi() {
  if (!canWriteConfig()) {
    return
  }
  try {
    const config = await store.resetAiApi()
    aiApiUrl.value = config?.aiApiUrl ?? ''
    aiApiKey.value = config?.aiApiKey ?? ''
    botRivalryEnabled.value = config?.botRivalryEnabled ?? false
    aiApiLoadedPath.value = config?.configPath ?? ''
  } catch (error) {
    const message = store.normalizeError(error)
    preferences.recordError(message, '恢复 AI 默认配置')
    store.setMessage(`${message} 可以重新读取配置后再试。`)
  }
}

function tauntsToText(items: string[]) {
  return items.join('\n')
}

function textToTaunts(value: string) {
  return value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function applyBotTauntsConfig(config: NonNullable<typeof store.botTauntsConfig>) {
  botTauntLines.value = {
    normalTaunts: tauntsToText(config.normalTaunts),
    headshotTaunts: tauntsToText(config.headshotTaunts),
    knifeTaunts: tauntsToText(config.knifeTaunts),
    botRivalryTaunts: tauntsToText(config.botRivalryTaunts),
    openingTrashTalks: tauntsToText(config.openingTrashTalks),
  }
  botTauntSingleLines.value = {
    roundKillTaunt: config.roundKillTaunt,
    multiKillTaunt: config.multiKillTaunt,
    clutchTaunt: config.clutchTaunt,
    saveTaunt: config.saveTaunt,
  }
  botTauntLoadedPath.value = config.configPath
}

async function refreshBotTauntsConfig() {
  try {
    const config = await store.refreshBotTauntsConfig()
    if (config) {
      applyBotTauntsConfig(config)
    }
  } catch (error) {
    const message = store.normalizeError(error)
    preferences.recordError(message, '读取嘲讽文本')
    store.setMessage(`${message} 可以重新读取，或检查 Taunts.json 是否能正常解析。`)
  }
}

async function saveBotTaunts() {
  if (!canWriteConfig()) {
    return false
  }
  try {
    preferences.createRestorePoint('保存嘲讽内容', store.selectedRoot, '写入 Taunts.json 文本配置', false)
    await store.saveBotTaunts({
      normalTaunts: textToTaunts(botTauntLines.value.normalTaunts),
      headshotTaunts: textToTaunts(botTauntLines.value.headshotTaunts),
      knifeTaunts: textToTaunts(botTauntLines.value.knifeTaunts),
      botRivalryTaunts: textToTaunts(botTauntLines.value.botRivalryTaunts),
      openingTrashTalks: textToTaunts(botTauntLines.value.openingTrashTalks),
      roundKillTaunt: botTauntSingleLines.value.roundKillTaunt,
      multiKillTaunt: botTauntSingleLines.value.multiKillTaunt,
      clutchTaunt: botTauntSingleLines.value.clutchTaunt,
      saveTaunt: botTauntSingleLines.value.saveTaunt,
    })
    await refreshBotTauntsConfig()
    preferences.recordAction('保存嘲讽内容', botTauntLoadedPath.value || store.selectedRoot)
    return true
  } catch (error) {
    const message = store.normalizeError(error)
    preferences.recordError(message, '保存嘲讽内容')
    store.setMessage(`${message} 请检查是否有空文本或 JSON 被占用。`)
    return false
  }
}

async function saveBotTauntsAndClose() {
  if (await saveBotTaunts()) {
    botTauntModalOpen.value = false
  }
}

async function resetBotTaunts() {
  if (!canWriteConfig()) {
    return
  }
  try {
    const config = await store.resetBotTaunts()
    if (config) {
      applyBotTauntsConfig(config)
    }
  } catch (error) {
    const message = store.normalizeError(error)
    preferences.recordError(message, '恢复嘲讽默认配置')
    store.setMessage(`${message} 可以重新读取配置后再试。`)
  }
}

async function refreshNadeRecoveryConfig() {
  try {
    const config = await store.refreshNadeRecoveryConfig()
    if (config) {
      nadeRecovery.value = {
        flash: config.flash,
        smoke: config.smoke,
        he: config.he,
        molotov: config.molotov,
        incgrenade: config.incgrenade,
        decoy: config.decoy,
      }
      nadeRecoveryLoadedPath.value = config.configPath
    }
  } catch (error) {
    const message = store.normalizeError(error)
    preferences.recordError(message, '读取道具压制开火配置')
    store.setMessage(`${message} 可以重新读取，或到帮助页复制诊断信息。`)
  }
}

async function saveNadeRecovery() {
  if (!canWriteConfig()) {
    return false
  }
  try {
    preferences.createRestorePoint('保存道具压制开火时间', store.selectedRoot, '写入 NadeSystem.json 道具后开火压制时间', false)
    await store.saveNadeRecovery(nadeRecovery.value)
    preferences.recordAction('保存道具压制开火', nadeRecoveryLoadedPath.value || store.selectedRoot)
    return true
  } catch (error) {
    const message = store.normalizeError(error)
    preferences.recordError(message, '保存道具压制开火时间')
    store.setMessage(`${message} 请确认 CS2 已退出，并重新读取配置。`)
    return false
  }
}

async function saveNadeRecoveryAndClose() {
  if (await saveNadeRecovery()) {
    nadeRecoveryModalOpen.value = false
  }
}

async function resetNadeRecovery() {
  if (!canWriteConfig()) {
    return
  }
  try {
    const config = await store.resetNadeRecovery()
    if (config) {
      nadeRecovery.value = {
        flash: config.flash,
        smoke: config.smoke,
        he: config.he,
        molotov: config.molotov,
        incgrenade: config.incgrenade,
        decoy: config.decoy,
      }
      nadeRecoveryLoadedPath.value = config.configPath
    }
  } catch (error) {
    const message = store.normalizeError(error)
    preferences.recordError(message, '恢复道具压制开火默认配置')
    store.setMessage(`${message} 可以重新读取配置后再试。`)
  }
}

function handleWorkshopCopied() {
  preferences.recordAction('复制启动项', '-disable_workshop_command_filtering')
  store.setMessage('启动项已复制：-disable_workshop_command_filtering')
}

function handleDemoCommandCopied() {
  preferences.recordAction('复制 Demo 命令', 'tv_enable 1; tv_autorecord 1')
  store.setMessage('控制台命令已复制：tv_enable 1; tv_autorecord 1')
}

async function refreshRecentDemo() {
  try {
    await store.refreshDemos()
    if (store.demoDiscovery?.recentDemo) {
      preferences.setLastDemoPath(store.demoDiscovery.recentDemo.path)
    }
    preferences.recordAction('查找最近 Demo', store.demoDiscovery?.recentDemo?.fileName ?? '没有找到 Demo')
  } catch (error) {
    const message = store.normalizeError(error)
    preferences.recordError(message, '查找最近 Demo')
    store.setMessage(`${message} 请确认 Demo 目录存在，或先复制录制命令打一局。`)
  }
}

async function refreshRecentDemoAndShow() {
  await refreshRecentDemo()
  demoDetailModalOpen.value = true
}

function handleDemoPathCopied(text: string) {
  preferences.setLastDemoPath(text)
  preferences.recordAction('复制 Demo 路径', text)
  store.setMessage(`Demo 路径已复制：${text}`)
}

async function openRecentDemoDirectory() {
  try {
    await store.openReplays()
    preferences.recordAction('打开 Demo 目录', store.selectedRoot || '未选择目录')
  } catch (error) {
    const message = store.normalizeError(error)
    preferences.recordError(message, '打开 Demo 目录')
    store.setMessage(`${message} 请先返回安装页重新检查目录。`)
  }
}

async function openRecentDemoFolder() {
  if (!recentDemo.value) {
    await openRecentDemoDirectory()
    return
  }

  try {
    await store.openDemoFolder(recentDemo.value.directoryPath)
  } catch (error) {
    const message = store.normalizeError(error)
    preferences.recordError(message, '打开 Demo 所在文件夹')
    store.setMessage(`${message} 可以先打开 Demo 目录再手动查找。`)
  }
}

onMounted(async () => {
  preferences.load()
  try {
    await store.refreshCs2Running()
    if (store.selectedRoot) {
      await refreshAiApiConfig()
      await refreshBotTauntsConfig()
      await refreshNadeRecoveryConfig()
      await refreshRecentDemo()
    }
  } catch (error) {
    const message = store.normalizeError(error)
    preferences.recordError(message, '进入游戏配置页')
    store.setMessage(message)
  }
})

</script>

<template>
  <section class="page-grid config-console-page">
    <ConsolePanel
      eyebrow="Configuration"
      title="配置控制台"
      :description="blockedReason || '当前可以配置。写入后会刷新对应配置状态。'"
      tone="strong"
    >
      <template #actions>
        <button class="ghost-button" @click="store.refreshCs2Running()">刷新游戏状态</button>
      </template>
      <div class="metric-grid">
        <MetricTile
          v-for="item in statusItems"
          :key="item.label"
          :label="item.label"
          :value="item.value"
          :state="item.state"
        />
      </div>
    </ConsolePanel>

    <article class="card config-section-tabs" aria-label="配置分区">
      <button
        v-for="section in configSections"
        :key="section.key"
        class="config-section-tab"
        type="button"
        :data-active="activeConfigSection === section.key"
        @click="activeConfigSection = section.key"
      >
        <strong>{{ section.label }}</strong>
        <span>{{ section.detail }}</span>
      </button>
    </article>

    <article v-if="recentConfigItems.length > 0" class="card recent-config-card">
      <div class="section-head">
        <div>
          <p class="eyebrow">最近改动</p>
          <h3>回头继续时不用重新找。</h3>
        </div>
      </div>
      <div class="recent-action-grid">
        <div v-for="item in recentConfigItems" :key="`${item.at}:${item.label}`" class="recent-action-item">
          <strong>{{ item.label }}</strong>
          <span>{{ item.detail }}</span>
          <small>{{ item.at }}</small>
        </div>
      </div>
    </article>

    <div v-show="activeConfigSection === 'base'" class="config-quick-grid">
      <article class="card config-quick-card">
        <div class="section-head">
          <div>
            <p class="eyebrow">Bot 难度</p>
            <h3>选择适合你的练习强度</h3>
          </div>
        </div>

        <div class="segmented-card-group">
          <button
            v-for="card in difficultyCards"
            :key="card.preset"
            class="segmented-card"
            type="button"
            :disabled="Boolean(blockedReason) || store.busy"
            @click="applyDifficulty(card.preset)"
          >
            <strong>{{ card.title }}</strong>
            <span>{{ card.description }}</span>
          </button>
        </div>
      </article>

      <article class="card config-quick-card">
        <div class="section-head">
          <div>
            <p class="eyebrow">模式切换</p>
            <h3>在线比赛 / Bot 模式</h3>
          </div>
        </div>

        <div class="segmented-card-group mode-card-group">
          <button
            v-for="card in modeCards"
            :key="card.preset"
            class="segmented-card"
            type="button"
            :disabled="Boolean(blockedReason) || store.busy"
            @click="switchMode(card.preset)"
          >
            <strong>{{ card.title }}</strong>
            <span>{{ card.description }}</span>
          </button>
        </div>
      </article>
    </div>

    <ConfigSection
      v-show="activeConfigSection === 'ai'"
      title="AI 聊天"
      :description="aiConfigStatus"
      :badge="store.aiApiConfig?.exists ? '已配置' : '可选'"
      :default-open="false"
    >
      <ConfigActionGroup
        primary-label="编辑"
        reset-label="恢复默认"
        :primary-disabled="Boolean(blockedReason)"
        :secondary-disabled="!store.selectedRoot"
        :reset-disabled="Boolean(blockedReason)"
        :busy="store.busy"
        @primary="aiApiModalOpen = true"
        @secondary="refreshAiApiConfig"
        @reset="resetAiApi"
      />
      <p v-if="aiApiLoadedPath && store.aiApiConfig?.exists" class="inline-path">
        配置文件：<code>{{ aiApiLoadedPath }}</code>
      </p>
    </ConfigSection>

    <ConfigSection
      v-show="activeConfigSection === 'taunts'"
      title="击杀嘲讽内容"
      :description="botTauntStatus"
      :badge="store.botTauntsConfig?.exists ? '已读取' : '可编辑'"
      :default-open="false"
    >
      <ConfigActionGroup
        primary-label="编辑"
        reset-label="恢复默认"
        :primary-disabled="Boolean(blockedReason)"
        :secondary-disabled="!store.selectedRoot"
        :reset-disabled="Boolean(blockedReason)"
        :busy="store.busy"
        @primary="botTauntModalOpen = true"
        @secondary="refreshBotTauntsConfig"
        @reset="resetBotTaunts"
      />
      <p v-if="botTauntLoadedPath && store.botTauntsConfig?.exists" class="inline-path">
        配置文件：<code>{{ botTauntLoadedPath }}</code>
      </p>
    </ConfigSection>

    <ConfigSection
      v-show="activeConfigSection === 'nades'"
      title="道具压制开火"
      :description="nadeRecoveryStatus"
      :badge="store.nadeRecoveryConfig?.exists ? '已读取' : '可编辑'"
      :default-open="false"
    >
      <ConfigActionGroup
        primary-label="编辑"
        reset-label="恢复默认"
        :primary-disabled="Boolean(blockedReason)"
        :secondary-disabled="!store.selectedRoot"
        :reset-disabled="Boolean(blockedReason)"
        :busy="store.busy"
        @primary="nadeRecoveryModalOpen = true"
        @secondary="refreshNadeRecoveryConfig"
        @reset="resetNadeRecovery"
      />
      <p v-if="nadeRecoveryLoadedPath && store.nadeRecoveryConfig?.exists" class="inline-path">
        配置文件：<code>{{ nadeRecoveryLoadedPath }}</code>
      </p>
    </ConfigSection>

    <ConfigSection v-show="activeConfigSection === 'demo'" title="辅助操作" :description="demoStatus" badge="按需使用" :default-open="true">
      <div class="manual-grid">
        <div class="manual-item">
          <strong>创意工坊地图启动项</strong>
          <div class="copy-row">
            <code>-disable_workshop_command_filtering</code>
            <CopyButton text="-disable_workshop_command_filtering" @copied="handleWorkshopCopied" />
          </div>
        </div>

        <div class="manual-item">
          <strong>切换在线 / Bot 模式后的 Steam 启动项</strong>
          <p class="muted">在线比赛删除 <code>-insecure</code>，继续打 Bot 时重新加回。</p>
        </div>

        <div class="manual-item">
          <strong>查找最近 Demo</strong>
          <div class="copy-row">
            <code>tv_enable 1; tv_autorecord 1</code>
            <CopyButton text="tv_enable 1; tv_autorecord 1" label="复制命令" copied-label="已复制命令" @copied="handleDemoCommandCopied" />
            <button class="ghost-button" :disabled="!store.selectedRoot || store.busy" @click="refreshRecentDemoAndShow">
              查找并查看详情
            </button>
            <button class="ghost-button" :disabled="!store.selectedRoot || store.busy" @click="openRecentDemoDirectory">
              打开 Demo 目录
            </button>
          </div>
        </div>
      </div>
    </ConfigSection>

    <ConfigEditorModal
      :open="aiApiModalOpen"
      title="设置 AI 聊天"
      description="保存后需要重启 CS2 或服务器。"
      save-label="保存 AI 聊天设置"
      :save-disabled="Boolean(blockedReason) || store.busy"
      :loading="store.busy"
      @close="aiApiModalOpen = false"
      @save="saveAiApiAndClose"
    >
      <p class="muted">
        默认不会写入 API Key。你可以使用自己准备的服务，也可以点击下方按钮启用我们免费提供的 AI 聊天 Key；
        按钮只会填入当前表单，保存后才会写入 BotTaunt.json。
      </p>
      <div class="inline-notice" data-state="ready">
        <strong>免费 AI 聊天 Key</strong>
        <span>这是我们免费提供给玩家使用的 Key。不会自动启用，也不会覆盖你已经填写的自定义 Key。</span>
        <div class="actions-row">
          <button
            class="ghost-button"
            type="button"
            :disabled="Boolean(blockedReason) || store.busy"
            @click="enableFreeAiApiKey"
          >
            启用免费 KEY
          </button>
        </div>
        <span v-if="freeAiApiMessage">{{ freeAiApiMessage }}</span>
      </div>
      <p class="muted">
        如果换成自己的服务，请填写接口地址和密钥；接口应接收
        <code>temperature</code>、<code>messages</code>，并返回 <code>reply</code> 或 OpenAI 兼容结果。
      </p>
      <div class="form-grid ai-api-form">
        <label class="field">
          <span>API 地址</span>
          <input
            v-model="aiApiUrl"
            type="url"
            placeholder="https://your-domain.com/api/chat"
            :disabled="Boolean(blockedReason) || store.busy"
          />
        </label>

        <label class="field">
          <span>API Key</span>
          <input
            v-model="aiApiKey"
            type="password"
            autocomplete="off"
            placeholder="your_api_key_here"
            :disabled="Boolean(blockedReason) || store.busy"
          />
        </label>

        <label class="checkbox-field">
          <input v-model="botRivalryEnabled" type="checkbox" :disabled="Boolean(blockedReason) || store.busy" />
          <span>
            <strong>开启 Bot 之间的低频互相嘲讽</strong>
            <small>开启后，Bot 击杀敌方 Bot 时会偶尔发送互相嘲讽内容。</small>
          </span>
        </label>
      </div>
      <template #actions>
        <button class="ghost-button" :disabled="Boolean(blockedReason) || store.busy" @click="resetAiApi">
          恢复默认
        </button>
      </template>
    </ConfigEditorModal>

    <ConfigEditorModal
      :open="botTauntModalOpen"
      title="设置击杀嘲讽内容"
      description="多行文本每组至少一条，特殊场景文本不能为空。"
      save-label="保存嘲讽内容"
      :save-disabled="Boolean(blockedReason) || store.busy"
      :loading="store.busy"
      @close="botTauntModalOpen = false"
      @save="saveBotTauntsAndClose"
    >
      <div class="form-grid bot-taunts-form">
        <label v-for="field in botTauntTextFields" :key="field.key" class="field">
          <span>{{ field.label }}</span>
          <textarea
            v-model="botTauntLines[field.key]"
            class="bot-taunts-textarea"
            :placeholder="field.hint"
            :disabled="Boolean(blockedReason) || store.busy"
          />
        </label>
      </div>

      <div class="form-grid bot-taunts-single-form">
        <label v-for="field in botTauntSingleTextFields" :key="field.key" class="field">
          <span>{{ field.label }}</span>
          <input
            v-model="botTauntSingleLines[field.key]"
            type="text"
            :placeholder="field.hint"
            :disabled="Boolean(blockedReason) || store.busy"
          />
        </label>
      </div>

      <template #actions>
        <button class="ghost-button" :disabled="Boolean(blockedReason) || store.busy" @click="resetBotTaunts">
          恢复默认
        </button>
      </template>
    </ConfigEditorModal>

    <ConfigEditorModal
      :open="nadeRecoveryModalOpen"
      title="设置道具压制开火时间"
      description="BOT 使用道具后，会在指定秒数内压制开火和瞄准。范围 0 到 5 秒，0 表示不压制。诱饵弹暂不开放配置。"
      save-label="保存压制时间"
      :save-disabled="Boolean(blockedReason) || store.busy"
      :loading="store.busy"
      @close="nadeRecoveryModalOpen = false"
      @save="saveNadeRecoveryAndClose"
    >
      <div class="form-grid nade-recovery-form">
        <div v-for="field in nadeRecoveryFields" :key="field.key" class="field range-field">
          <div class="range-field__head">
            <span>{{ field.label }}</span>
            <strong>{{ nadeRecovery[field.key].toFixed(2) }} 秒</strong>
          </div>
          <input
            v-model.number="nadeRecovery[field.key]"
            type="range"
            min="0"
            max="5"
            step="0.05"
            :disabled="Boolean(blockedReason) || store.busy"
          />
          <input
            v-model.number="nadeRecovery[field.key]"
            type="number"
            min="0"
            max="5"
            step="0.05"
            :placeholder="field.hint"
            :disabled="Boolean(blockedReason) || store.busy"
          />
        </div>
      </div>
      <template #actions>
        <button class="ghost-button" :disabled="Boolean(blockedReason) || store.busy" @click="resetNadeRecovery">
          恢复默认
        </button>
      </template>
    </ConfigEditorModal>

    <ActionModal
      :open="demoDetailModalOpen"
      title="最近 Demo 详情"
      :subtitle="demoStatus"
      cancel-label="关闭"
      hide-confirm
      @close="demoDetailModalOpen = false"
      @confirm="demoDetailModalOpen = false"
    >
      <div class="demo-result">
        <template v-if="recentDemo">
          <dl>
            <div>
              <dt>文件</dt>
              <dd>{{ recentDemo.fileName }}</dd>
            </div>
            <div>
              <dt>时间</dt>
              <dd>{{ recentDemo.modifiedAt }}</dd>
            </div>
            <div>
              <dt>目录</dt>
              <dd><code>{{ recentDemo.directoryPath }}</code></dd>
            </div>
            <div>
              <dt>完整路径</dt>
              <dd><code>{{ recentDemo.path }}</code></dd>
            </div>
          </dl>
          <div class="copy-row">
            <CopyButton :text="recentDemo.path" label="复制 Demo 路径" copied-label="已复制路径" @copied="handleDemoPathCopied" />
            <button class="ghost-button" @click="openRecentDemoFolder">
              打开所在文件夹
            </button>
          </div>
        </template>
        <p v-else class="muted">{{ demoStatus }}</p>
      </div>
    </ActionModal>
  </section>
</template>
