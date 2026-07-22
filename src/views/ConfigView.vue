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
const nadeRecoveryModalOpen = ref(false)
const demoDetailModalOpen = ref(false)
const activeConfigSection = ref<'base' | 'nades' | 'demo'>('base')
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

const blockedReason = computed(() => {
  if (!store.selectedRoot) {
    return '请先到"安装检查"页选择游戏目录。'
  }
  if (!store.readyForConfig) {
    return '当前环境尚未就绪，请先完成安装。'
  }
  if (store.cs2Running) {
    return '检测到 CS2 正在运行，请先退出游戏。'
  }
  return ''
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
  .filter((item) => ['设置难度', '切换模式', '保存道具压制开火'].includes(item.label))
  .slice(0, 4))

const configSections = computed(() => [
  { key: 'base' as const, label: '基础配置', detail: blockedReason.value || '难度和模式可写入' },
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
      :description="blockedReason || 'Bot 难度、游戏模式、投掷物恢复、Demo 录制。写入前请退出 CS2。'"
      tone="strong"
      class="glass"
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

    <article class="card config-section-tabs glass" aria-label="配置分区">
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

    <article v-if="recentConfigItems.length > 0" class="card recent-config-card glass">
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
      <article class="card config-quick-card glass">
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
            class="segmented-card glass"
            type="button"
            :disabled="Boolean(blockedReason) || store.busy"
            @click="applyDifficulty(card.preset)"
          >
            <strong>{{ card.title }}</strong>
            <span>{{ card.description }}</span>
          </button>
        </div>
      </article>

      <article class="card config-quick-card glass">
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
            class="segmented-card glass"
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

    <ConfigSection v-show="activeConfigSection === 'demo'" title="比赛记录" :description="demoStatus" badge="按需使用" :default-open="true">
      <div class="match-record-grid">
        <div class="manual-item">
          <strong>录制开关</strong>
          <div class="copy-row">
            <code>tv_enable 1; tv_autorecord 1</code>
            <CopyButton text="tv_enable 1; tv_autorecord 1" label="复制" copied-label="已复制" @copied="handleDemoCommandCopied" />
          </div>
          <p class="muted">控制台粘贴后每次对局自动录像。Demo保存在 csgo/replays。</p>
        </div>

        <div class="manual-item">
          <strong>创意工坊地图</strong>
          <div class="copy-row">
            <code>-disable_workshop_command_filtering</code>
            <CopyButton text="-disable_workshop_command_filtering" @copied="handleWorkshopCopied" />
          </div>
          <p class="muted">加入 Steam 启动项才能正常加载创意工坊地图。</p>
        </div>

        <div class="manual-item">
          <strong>在线/Bot 模式切换</strong>
          <p class="muted">在线比赛删除 <code>-insecure</code>，继续打 Bot 时重新加回。</p>
        </div>

        <div class="manual-item">
          <div class="section-head">
            <strong>最近录像</strong>
            <div class="demo-actions">
              <button class="ghost-button" :disabled="!store.selectedRoot || store.busy" @click="refreshRecentDemoAndShow">刷新</button>
              <button class="ghost-button" :disabled="!store.selectedRoot || store.busy" @click="openRecentDemoDirectory">打开目录</button>
            </div>
          </div>
          <div v-if="recentDemo" class="recent-demo-card">
            <div class="demo-info">
              <code>{{ recentDemo.fileName }}</code>
              <span class="muted">{{ recentDemo.modifiedAt }}</span>
            </div>
            <div class="demo-actions">
              <CopyButton :text="recentDemo.path" @copied="handleDemoPathCopied(recentDemo.path)" />
              <button class="ghost-button" @click="openRecentDemoFolder">打开位置</button>
            </div>
          </div>
          <p v-else class="muted">暂无录像。复制上方命令后打一局即可自动录制。</p>
        </div>
      </div>
    </ConfigSection>

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

<style scoped>
.demo-actions { display: flex; gap: 0.4rem; align-items: center; flex-wrap: wrap; }
.recent-demo-card {
  display: flex; flex-direction: column; gap: 0.5rem;
  padding: 0.75rem; margin-top: 0.5rem;
  border: 1px solid var(--panel-border); border-radius: var(--radius-sm);
  background: var(--ghost-bg);
}
.demo-info { display: flex; flex-direction: column; gap: 0.15rem; }
.demo-info code { font-size: var(--fs-sm); word-break: break-all; }
.match-record-grid { display: flex; flex-direction: column; gap: 1rem; }
</style>
