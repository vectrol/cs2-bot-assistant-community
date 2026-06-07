<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

import ActionModal from '@/components/ActionModal.vue'
import CollapsiblePanel from '@/components/CollapsiblePanel.vue'
import SummaryStrip from '@/components/SummaryStrip.vue'
import { useCs2Store } from '@/stores/cs2'
import type { DifficultyPreset, GameModePreset } from '@/types/cs2'

const store = useCs2Store()
const workshopCopied = ref(false)
const demoCommandCopied = ref(false)
const demoPathCopied = ref(false)
const aiApiModalOpen = ref(false)
const botTauntModalOpen = ref(false)
const nadeRecoveryModalOpen = ref(false)
const demoDetailModalOpen = ref(false)
const aiApiUrl = ref('')
const aiApiKey = ref('')
const botRivalryEnabled = ref(false)
const aiApiLoadedPath = ref('')
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

let workshopCopiedTimer: ReturnType<typeof setTimeout> | null = null
let demoCommandCopiedTimer: ReturnType<typeof setTimeout> | null = null
let demoPathCopiedTimer: ReturnType<typeof setTimeout> | null = null

const difficultyCards: Array<{ title: string; preset: DifficultyPreset; description: string }> = [
  { title: '简单', preset: 'low', description: '适合刚开始练习，Bot 更容易应对。' },
  { title: '标准', preset: 'medium', description: '更接近日常对局，推荐大多数玩家使用。' },
  { title: '高强度', preset: 'high', description: '适合练反应、对枪和残局处理。' },
]

const modeCards: Array<{ title: string; preset: GameModePreset; description: string }> = [
  { title: '切到在线模式', preset: 'online', description: '准备正常进入线上比赛时使用。' },
  { title: '切回 Bot 模式', preset: 'withBots', description: '继续打人机或练习地图时使用。' },
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
    return '选择并安装 CS2 目录后，可以在这里修改 BotTaunt 嘲讽文本。'
  }
  if (!store.botTauntsConfig.exists) {
    return '尚未找到 Taunts.json，保存后会自动创建。'
  }
  return `当前配置文件：${store.botTauntsConfig.configPath}`
})

const nadeRecoveryFields = [
  { key: 'flash', label: '闪光弹', hint: 'flash' },
  { key: 'smoke', label: '烟雾弹', hint: 'smoke' },
  { key: 'he', label: '高爆雷', hint: 'he' },
  { key: 'molotov', label: '燃烧瓶', hint: 'molotov' },
  { key: 'incgrenade', label: '燃烧弹', hint: 'incgrenade' },
  { key: 'decoy', label: '诱饵弹', hint: 'decoy' },
] as const

const nadeRecoveryStatus = computed(() => {
  if (!store.nadeRecoveryConfig) {
    return '选择并安装 CS2 目录后，可以在这里编辑 NadeSystem 恢复时间。'
  }
  if (!store.nadeRecoveryConfig.exists) {
    return '尚未找到 NadeSystem.json，保存后会自动创建。'
  }
  return `当前配置文件：${store.nadeRecoveryConfig.configPath}`
})

const recentDemo = computed(() => store.demoDiscovery?.recentDemo ?? null)

const summaryItems = computed(() => [
  {
    label: 'CS2 目录',
    value: store.selectedRoot || '未选择',
    state: store.selectedRoot ? 'ready' as const : 'warn' as const,
  },
  {
    label: '游戏运行状态',
    value: store.cs2Running ? '正在运行' : '未运行',
    state: store.cs2Running ? 'danger' as const : 'ready' as const,
  },
  {
    label: '安装状态',
    value: store.readyForConfig ? '可配置' : '未就绪',
    state: store.readyForConfig ? 'ready' as const : 'warn' as const,
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

async function applyDifficulty(preset: DifficultyPreset) {
  try {
    await store.applyDifficulty(preset)
  } catch (error) {
    store.setMessage(store.normalizeError(error))
  }
}

async function switchMode(preset: GameModePreset) {
  try {
    await store.switchGameMode(preset)
  } catch (error) {
    store.setMessage(store.normalizeError(error))
  }
}

async function refreshAiApiConfig() {
  try {
    const config = await store.refreshAiApiConfig()
    aiApiUrl.value = config?.aiApiUrl ?? ''
    aiApiKey.value = config?.aiApiKey ?? ''
    botRivalryEnabled.value = config?.botRivalryEnabled ?? false
    aiApiLoadedPath.value = config?.configPath ?? ''
  } catch (error) {
    store.setMessage(store.normalizeError(error))
  }
}

async function saveAiApi() {
  try {
    await store.saveAiApi({
      aiApiUrl: aiApiUrl.value,
      aiApiKey: aiApiKey.value,
      botRivalryEnabled: botRivalryEnabled.value,
    })
  } catch (error) {
    store.setMessage(store.normalizeError(error))
  }
}

async function saveAiApiAndClose() {
  await saveAiApi()
  aiApiModalOpen.value = false
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
    store.setMessage(store.normalizeError(error))
  }
}

async function saveBotTaunts() {
  try {
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
  } catch (error) {
    store.setMessage(store.normalizeError(error))
  }
}

async function saveBotTauntsAndClose() {
  await saveBotTaunts()
  botTauntModalOpen.value = false
}

async function resetBotTaunts() {
  try {
    const config = await store.resetBotTaunts()
    if (config) {
      applyBotTauntsConfig(config)
    }
  } catch (error) {
    store.setMessage(store.normalizeError(error))
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
    store.setMessage(store.normalizeError(error))
  }
}

async function saveNadeRecovery() {
  try {
    await store.saveNadeRecovery(nadeRecovery.value)
  } catch (error) {
    store.setMessage(store.normalizeError(error))
  }
}

async function saveNadeRecoveryAndClose() {
  await saveNadeRecovery()
  nadeRecoveryModalOpen.value = false
}

function copyWorkshopFlag() {
  navigator.clipboard.writeText('-disable_workshop_command_filtering')
  workshopCopied.value = true
  if (workshopCopiedTimer) {
    clearTimeout(workshopCopiedTimer)
  }
  workshopCopiedTimer = setTimeout(() => {
    workshopCopied.value = false
    workshopCopiedTimer = null
  }, 1000)
  store.setMessage('启动项已复制：-disable_workshop_command_filtering')
}

function copyDemoCommand() {
  navigator.clipboard.writeText('tv_enable 1; tv_autorecord 1')
  demoCommandCopied.value = true
  if (demoCommandCopiedTimer) {
    clearTimeout(demoCommandCopiedTimer)
  }
  demoCommandCopiedTimer = setTimeout(() => {
    demoCommandCopied.value = false
    demoCommandCopiedTimer = null
  }, 1000)
  store.setMessage('控制台命令已复制：tv_enable 1; tv_autorecord 1')
}

async function refreshRecentDemo() {
  try {
    await store.refreshDemos()
  } catch (error) {
    store.setMessage(store.normalizeError(error))
  }
}

async function refreshRecentDemoAndShow() {
  await refreshRecentDemo()
  demoDetailModalOpen.value = true
}

function copyDemoPath() {
  if (!recentDemo.value) {
    return
  }

  navigator.clipboard.writeText(recentDemo.value.path)
  demoPathCopied.value = true
  if (demoPathCopiedTimer) {
    clearTimeout(demoPathCopiedTimer)
  }
  demoPathCopiedTimer = setTimeout(() => {
    demoPathCopied.value = false
    demoPathCopiedTimer = null
  }, 1000)
  store.setMessage(`Demo 路径已复制：${recentDemo.value.path}`)
}

async function openRecentDemoDirectory() {
  try {
    await store.openReplays()
  } catch (error) {
    store.setMessage(store.normalizeError(error))
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
    store.setMessage(store.normalizeError(error))
  }
}

onMounted(async () => {
  await store.refreshCs2Running()
  if (store.selectedRoot) {
    await refreshAiApiConfig()
    await refreshBotTauntsConfig()
    await refreshNadeRecoveryConfig()
    await refreshRecentDemo()
  }
})

onBeforeUnmount(() => {
  if (workshopCopiedTimer) {
    clearTimeout(workshopCopiedTimer)
  }
  if (demoCommandCopiedTimer) {
    clearTimeout(demoCommandCopiedTimer)
  }
  if (demoPathCopiedTimer) {
    clearTimeout(demoPathCopiedTimer)
  }
})
</script>

<template>
  <section class="page-grid">
    <article class="hero-banner">
      <div>
        <p class="eyebrow">游戏设置</p>
        <h2>切换 Bot 难度、游戏模式和插件配置。</h2>
      </div>
      <div class="hero-status">
        <span class="status-badge" :data-state="blockedReason ? 'warn' : 'ready'">
          {{ blockedReason || '现在可以修改设置' }}
        </span>
        <button class="ghost-button" @click="store.refreshCs2Running()">刷新游戏状态</button>
      </div>
    </article>

    <SummaryStrip :items="summaryItems" />

    <div class="content-grid two-column">
      <article class="card">
        <div class="section-head">
          <div>
            <p class="eyebrow">Bot 难度</p>
            <h3>选择适合你的练习强度</h3>
          </div>
        </div>

        <div class="tile-grid">
          <button
            v-for="card in difficultyCards"
            :key="card.preset"
            class="action-tile"
            :disabled="Boolean(blockedReason)"
            @click="applyDifficulty(card.preset)"
          >
            <strong>{{ card.title }}</strong>
            <span>{{ card.description }}</span>
          </button>
        </div>
      </article>

      <article class="card">
        <div class="section-head">
          <div>
            <p class="eyebrow">模式切换</p>
            <h3>在线比赛 / Bot 模式</h3>
          </div>
        </div>

        <div class="tile-grid">
          <button
            v-for="card in modeCards"
            :key="card.preset"
            class="action-tile"
            :disabled="Boolean(blockedReason)"
            @click="switchMode(card.preset)"
          >
            <strong>{{ card.title }}</strong>
            <span>{{ card.description }}</span>
          </button>
        </div>
      </article>
    </div>

    <CollapsiblePanel title="AI 聊天 API" :subtitle="aiConfigStatus" :badge="store.aiApiConfig?.exists ? '已配置' : '可选'">
      <div class="actions-row">
        <button class="primary-button" :disabled="Boolean(blockedReason) || store.busy" @click="aiApiModalOpen = true">
          编辑 API 配置
        </button>
        <button class="ghost-button" :disabled="!store.selectedRoot || store.busy" @click="refreshAiApiConfig">
          重新读取
        </button>
      </div>
      <p v-if="aiApiLoadedPath && store.aiApiConfig?.exists" class="inline-path">
        配置文件：<code>{{ aiApiLoadedPath }}</code>
      </p>
    </CollapsiblePanel>

    <CollapsiblePanel title="BotTaunt 嘲讽文本" :subtitle="botTauntStatus" :badge="store.botTauntsConfig?.exists ? '已读取' : '可编辑'">
      <div class="actions-row">
        <button class="primary-button" :disabled="Boolean(blockedReason) || store.busy" @click="botTauntModalOpen = true">
          编辑嘲讽文本
        </button>
        <button class="ghost-button" :disabled="!store.selectedRoot || store.busy" @click="refreshBotTauntsConfig">
          重新读取
        </button>
      </div>
      <p v-if="botTauntLoadedPath && store.botTauntsConfig?.exists" class="inline-path">
        配置文件：<code>{{ botTauntLoadedPath }}</code>
      </p>
    </CollapsiblePanel>

    <CollapsiblePanel title="NadeSystem 恢复时间" :subtitle="nadeRecoveryStatus" :badge="store.nadeRecoveryConfig?.exists ? '已读取' : '可编辑'">
      <div class="actions-row">
        <button class="primary-button" :disabled="Boolean(blockedReason) || store.busy" @click="nadeRecoveryModalOpen = true">
          编辑恢复时间
        </button>
        <button class="ghost-button" :disabled="!store.selectedRoot || store.busy" @click="refreshNadeRecoveryConfig">
          重新读取
        </button>
      </div>
      <p v-if="nadeRecoveryLoadedPath && store.nadeRecoveryConfig?.exists" class="inline-path">
        配置文件：<code>{{ nadeRecoveryLoadedPath }}</code>
      </p>
    </CollapsiblePanel>

    <CollapsiblePanel title="Demo 工具和手动步骤" :subtitle="demoStatus" badge="按需使用">
      <div class="manual-grid">
        <div class="manual-item">
          <strong>创意工坊地图启动项</strong>
          <div class="copy-row">
            <code>-disable_workshop_command_filtering</code>
            <button class="ghost-button" @click="copyWorkshopFlag">
              {{ workshopCopied ? '已复制' : '复制' }}
            </button>
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
            <button class="ghost-button" @click="copyDemoCommand">
              {{ demoCommandCopied ? '已复制' : '复制命令' }}
            </button>
            <button class="ghost-button" :disabled="!store.selectedRoot || store.busy" @click="refreshRecentDemoAndShow">
              查找并查看详情
            </button>
            <button class="ghost-button" :disabled="!store.selectedRoot || store.busy" @click="openRecentDemoDirectory">
              打开 Demo 目录
            </button>
          </div>
        </div>
      </div>
    </CollapsiblePanel>

    <ActionModal
      :open="aiApiModalOpen"
      title="编辑 AI API 配置"
      subtitle="保存后需要重启 CS2 或服务器。"
      confirm-label="保存配置"
      @close="aiApiModalOpen = false"
      @confirm="saveAiApiAndClose"
    >
      <p class="muted">
        Bot 默认使用内置 LBTV API。需要换成自己的服务时，填写接口地址和密钥；接口应接收
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
      </div>
    </ActionModal>

    <ActionModal
      :open="botTauntModalOpen"
      title="编辑 BotTaunt 嘲讽文本"
      subtitle="多行文本每组至少一条，特殊场景文本不能为空。"
      confirm-label="保存文本"
      @close="botTauntModalOpen = false"
      @confirm="saveBotTauntsAndClose"
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
          恢复默认文本
        </button>
      </template>
    </ActionModal>

    <ActionModal
      :open="nadeRecoveryModalOpen"
      title="编辑 NadeSystem 恢复时间"
      subtitle="数值单位为秒，插件实际支持 0 到 3 秒。"
      confirm-label="保存恢复时间"
      @close="nadeRecoveryModalOpen = false"
      @confirm="saveNadeRecoveryAndClose"
    >
      <div class="form-grid nade-recovery-form">
        <label v-for="field in nadeRecoveryFields" :key="field.key" class="field">
          <span>{{ field.label }}</span>
          <input
            v-model.number="nadeRecovery[field.key]"
            type="number"
            min="0"
            max="3"
            step="0.05"
            :placeholder="field.hint"
            :disabled="Boolean(blockedReason) || store.busy"
          />
        </label>
      </div>
    </ActionModal>

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
            <button class="ghost-button" @click="copyDemoPath">
              {{ demoPathCopied ? '已复制路径' : '复制 Demo 路径' }}
            </button>
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
