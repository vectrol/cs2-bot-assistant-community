<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { open } from '@tauri-apps/plugin-dialog'

import ActionModal from '@/components/ActionModal.vue'
import CollapsiblePanel from '@/components/CollapsiblePanel.vue'
import ConsolePanel from '@/components/layout/ConsolePanel.vue'
import CopyButton from '@/components/CopyButton.vue'
import MetricTile from '@/components/ui/MetricTile.vue'
import QuickActionsBar from '@/components/QuickActionsBar.vue'
import TaskStepper from '@/components/TaskStepper.vue'
import { appConfig } from '@/config/app'
import { useCs2Store } from '@/stores/cs2'
import { useUiPreferencesStore } from '@/stores/ui-preferences'

const store = useCs2Store()
const preferences = useUiPreferencesStore()
const router = useRouter()
const installConfirmOpen = ref(false)
const diagnosticsOpen = ref(false)
const installCompleted = ref(false)
const confirmExited = ref(false)
const confirmRoot = ref(false)
const confirmLaunchOption = ref(false)
const visibleStatusCount = ref(5)
const currentResourcePackageLabel = computed(() => `当前内置 ${appConfig.appVersion} 包`)

const statusRows = computed(() => {
  if (!store.environment) {
    return []
  }

  return [
    { label: 'game 文件夹', value: store.environment.gameDirExists },
    { label: 'csgo 文件夹', value: store.environment.csgoDirExists },
    { label: 'MetaMod', value: store.environment.metamodExists },
    { label: 'CounterStrikeSharp', value: store.environment.counterstrikeSharpExists },
    { label: 'gameinfo.gi', value: store.environment.gameinfoExists },
    { label: 'overrides/botprofile.vpk', value: store.environment.activeBotprofileExists },
    { label: 'backup/Online/gameinfo.gi', value: store.environment.backupOnlineGameinfoExists },
    { label: 'backup/WithBots/gameinfo.gi', value: store.environment.backupWithbotsGameinfoExists },
    { label: 'overrides/Low/botprofile.vpk', value: store.environment.lowProfileExists },
    { label: 'overrides/Medium/botprofile.vpk', value: store.environment.mediumProfileExists },
    { label: 'overrides/High/botprofile.vpk', value: store.environment.highProfileExists },
    { label: 'BotHider', value: store.environment.botHiderExists },
    { label: 'RayTrace', value: store.environment.rayTraceExists },
    { label: 'core.json', value: store.environment.coreConfigExists },
    { label: 'BotHiderImpl', value: store.environment.botHiderImplExists },
    { label: 'RayTraceImpl', value: store.environment.rayTraceImplExists },
    { label: 'RoundDamageRecap', value: store.environment.roundDamageRecapExists },
  ]
})

const visibleStatusRows = computed(() => statusRows.value.slice(0, visibleStatusCount.value))

const hasMoreStatusRows = computed(() => visibleStatusCount.value < statusRows.value.length)

function showMoreStatusRows() {
  visibleStatusCount.value = Math.min(visibleStatusCount.value + 5, statusRows.value.length)
}

function collapseStatusRows() {
  visibleStatusCount.value = 5
}

const canInstall = computed(() => (
  Boolean(store.selectedRoot)
  && !store.cs2Running
  && !store.busy
))

const installBlockReason = computed(() => {
  if (!store.selectedRoot) {
    return '请先选择 CS2 根目录'
  }
  if (store.cs2Running) {
    return '请先退出 CS2'
  }
  return ''
})

const primaryStatusMessage = computed(() => {
  if (store.cs2Running) {
    return '检测到 CS2 正在运行，请先退出游戏。'
  }
  if (!store.selectedRoot) {
    return '先选择 CS2 游戏目录。'
  }
  if (store.environment?.baseEnvironmentReady) {
    return `基础插件环境已安装，仍可覆盖更新${currentResourcePackageLabel.value}。`
  }
  return '目录已确认，可以安装人机插件包。'
})

const installActionHint = computed(() => {
  if (installBlockReason.value) {
    return installBlockReason.value
  }
  if (store.environment?.baseEnvironmentReady) {
    return `当前检查通过不代表已是最新版，可重新安装/覆盖更新到${currentResourcePackageLabel.value}。`
  }
  return '环境缺失时可执行安装，会先进入安全确认流程。'
})

const installActionDisabled = computed(() => store.busy || Boolean(installBlockReason.value))

const summaryItems = computed(() => [
  {
    label: 'CS2 根目录',
    value: store.selectedRoot || '未选择',
    state: store.selectedRoot ? 'ready' as const : 'warn' as const,
  },
  {
    label: '基础插件环境',
    value: store.environment?.baseEnvironmentReady ? '完整' : '待安装',
    state: store.environment?.baseEnvironmentReady ? 'ready' as const : 'warn' as const,
  },
  {
    label: '游戏运行状态',
    value: store.cs2Running ? '正在运行' : '未运行',
    state: store.cs2Running ? 'danger' as const : 'ready' as const,
  },
  {
    label: '当前动作',
    value: installBlockReason.value || '安装人机插件包',
    state: store.cs2Running ? 'danger' as const : store.selectedRoot ? 'ready' as const : 'warn' as const,
  },
])

const stepperItems = computed(() => [
  {
    title: '选择 CS2 根目录',
    description: store.selectedRoot || '选择 Counter-Strike Global Offensive 文件夹，不是 game 或 csgo 子目录。',
    state: store.selectedRoot ? 'complete' as const : 'current' as const,
  },
  {
    title: '安装人机插件包',
    description: store.environment?.baseEnvironmentReady
      ? `基础插件环境已安装，但旧包仍建议用${currentResourcePackageLabel.value}覆盖更新。`
      : '确认目录后执行安装。',
    state: store.environment?.baseEnvironmentReady
      ? 'complete' as const
      : store.selectedRoot
        ? 'current' as const
        : 'pending' as const,
  },
  {
    title: '添加 Steam 启动项',
    description: '复制 -insecure，手动加入 CS2 的 Steam 启动项。',
    state: store.environment?.baseEnvironmentReady ? 'manual' as const : 'pending' as const,
  },
])

const installChecklistComplete = computed(() => (
  confirmExited.value && confirmRoot.value && confirmLaunchOption.value
))

const readinessRows = computed(() => [
  {
    label: 'CS2 根目录是否正确',
    value: store.selectedRoot ? '已选择' : '未选择',
    state: store.selectedRoot ? 'ready' as const : 'warn' as const,
  },
  {
    label: '基础插件环境是否完整',
    value: store.environment?.baseEnvironmentReady ? '完整' : '待安装',
    state: store.environment?.baseEnvironmentReady ? 'ready' as const : 'warn' as const,
  },
  {
    label: '是否检测到 CS2 正在运行',
    value: store.cs2Running ? '正在运行' : '未运行',
    state: store.cs2Running ? 'danger' as const : 'ready' as const,
  },
  {
    label: '是否可以安装/配置',
    value: store.cs2Running ? '请先退出游戏' : store.selectedRoot ? '可以继续' : '先选择目录',
    state: store.cs2Running ? 'danger' as const : store.selectedRoot ? 'ready' as const : 'warn' as const,
  },
])

const repairActions = computed(() => [
  {
    title: '重新检查目录',
    description: store.selectedRoot ? '重新读取当前目录的文件状态。' : '先选择 CS2 根目录，再做完整检查。',
    disabled: !store.selectedRoot || store.busy,
    action: refreshAll,
  },
  {
    title: '重新扫描环境',
    description: '重新扫描 Steam 常见安装位置和历史选择。',
    disabled: store.busy,
    action: scanAndRemember,
  },
  {
    title: '修复缺失项',
    description: '重新执行安装流程，保留已有插件配置，也可覆盖更新旧包。',
    disabled: !canInstall.value,
    action: () => {
      installConfirmOpen.value = true
    },
  },
])

async function handleBrowse() {
  try {
    const result = await open({
      directory: true,
      multiple: false,
      title: '选择 CS2 游戏目录',
    })

    if (typeof result === 'string') {
      await store.selectRoot(result)
      preferences.setLastSelectedRoot(store.selectedRoot)
      preferences.recordAction('选择目录', store.selectedRoot)
      await store.refreshDiagnostics()
      installCompleted.value = false
      store.setMessage(`已选择：${store.selectedRoot}`)
    }
  } catch (error) {
    store.setMessage(store.normalizeError(error))
  }
}

async function refreshAll() {
  try {
    await store.refreshCs2Running()
    await store.refreshEnvironment()
    await store.refreshDiagnostics()
    preferences.recordAction('重新检查', store.selectedRoot || '未选择目录')
  } catch (error) {
    const message = store.normalizeError(error)
    preferences.recordError(message, '重新检查')
    store.setMessage(`${message} 可尝试重新扫描环境，或到帮助页复制诊断信息。`)
  }
}

async function scanAndRemember() {
  try {
    await store.scanRoots()
    if (store.selectedRoot) {
      preferences.setLastSelectedRoot(store.selectedRoot)
    }
    preferences.recordAction('重新扫描环境', `${store.candidates.length} 个候选目录`)
  } catch (error) {
    const message = store.normalizeError(error)
    preferences.recordError(message, '重新扫描环境')
    store.setMessage(`${message} 可手动选择 CS2 根目录后再重试。`)
  }
}

function resetInstallConfirm() {
  confirmExited.value = false
  confirmRoot.value = false
  confirmLaunchOption.value = false
}

function closeInstallConfirm() {
  installConfirmOpen.value = false
  resetInstallConfirm()
}

function handleInstallButton() {
  if (!canInstall.value) {
    return
  }
  installConfirmOpen.value = true
}

async function handleSelectCandidate(path: string) {
  try {
    await store.selectRoot(path)
    preferences.setLastSelectedRoot(store.selectedRoot)
    preferences.recordAction('切换目录', store.selectedRoot)
    await store.refreshDiagnostics()
    installCompleted.value = false
  } catch (error) {
    store.setMessage(store.normalizeError(error))
  }
}

async function handleInstall() {
  if (!installChecklistComplete.value || !canInstall.value) {
    return
  }

  try {
    preferences.createRestorePoint('安装人机插件包', store.selectedRoot, '安装或覆盖更新基础插件环境，并保留已有用户配置', false)
    await store.install()
    preferences.recordAction('安装完成', store.selectedRoot)
    installCompleted.value = true
    closeInstallConfirm()
    await refreshAll()
  } catch (error) {
    const message = store.normalizeError(error)
    preferences.recordError(message, '安装人机插件包')
    store.setMessage(`${message} 请先重新检查目录；如果仍失败，到帮助页复制诊断信息。`)
  } finally {
    await store.refreshDiagnostics()
  }
}

function handleCopiedLaunchOption() {
  preferences.recordAction('复制启动项', '-insecure')
  store.setMessage('启动项已复制：-insecure')
}

async function handleOpenDemos() {
  try {
    await store.openReplays()
    if (store.demoDiscovery?.recentDemo) {
      preferences.setLastDemoPath(store.demoDiscovery.recentDemo.path)
    }
    preferences.recordAction('打开 Demo 目录', store.selectedRoot || '未选择目录')
  } catch (error) {
    const message = store.normalizeError(error)
    preferences.recordError(message, '打开 Demo 目录')
    store.setMessage(`${message} 先确认已选择正确 CS2 目录。`)
  }
}

function openLaunchGameModal() {
  preferences.recordAction('打开 CS2', '从快捷动作触发')
  store.launchGame().catch((error: unknown) => {
    const message = store.normalizeError(error)
    preferences.recordError(message, '打开 CS2')
  })
}

onMounted(async () => {
  preferences.load()
  try {
    await store.scanRoots()
    await store.refreshCs2Running()
    await store.refreshDiagnostics()
  } catch (error) {
    const message = store.normalizeError(error)
    preferences.recordError(message, '进入安装页')
    store.setMessage(message)
  }
})
</script>

<template>
  <section class="page-grid install-console-page">
    <section class="ops-overview">
      <ConsolePanel
        eyebrow="Preparation"
        title="准备环境"
        :description="primaryStatusMessage"
        tone="strong"
      >
        <template #actions>
          <button class="ghost-button" type="button" @click="handleBrowse">
            {{ store.selectedRoot ? '重新选择目录' : '选择 CS2 根目录' }}
          </button>
          <button class="ghost-button" type="button" :disabled="store.busy" @click="refreshAll">重新检查</button>
        </template>
        <div class="install-action-dock">
          <div>
            <p
              class="install-hero-hint"
              :data-state="store.environment?.baseEnvironmentReady ? 'ready' : installBlockReason ? 'warn' : 'info'"
            >
              {{ installActionHint }}
            </p>
          </div>
          <button class="primary-button install-hero-button" type="button" :disabled="installActionDisabled" @click="handleInstallButton">
            安装人机插件包
          </button>
        </div>
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

      <ConsolePanel eyebrow="Guardrail" title="安装安全检查" description="安装前必须确认目录、进程和启动项。">
        <div class="readiness-summary">
          <div v-for="row in readinessRows" :key="row.label" class="readiness-summary__row">
            <span>{{ row.label }}</span>
            <strong :data-state="row.state">{{ row.value }}</strong>
          </div>
        </div>
      </ConsolePanel>
    </section>

    <TaskStepper :steps="stepperItems" />

    <QuickActionsBar
      :busy="store.busy"
      :can-open-demo="Boolean(store.selectedRoot)"
      @refresh="refreshAll"
      @open-game="openLaunchGameModal"
      @open-config="router.push('/config')"
      @open-demos="handleOpenDemos"
      @copied-launch-option="handleCopiedLaunchOption"
    />

    <div class="content-grid two-column">
      <article class="card">
        <div class="section-head">
          <div>
            <p class="eyebrow">游戏目录</p>
            <h3>当前选择</h3>
          </div>
          <span class="status-badge" :data-state="store.selectedRoot ? 'ready' : 'warn'">
            {{ store.selectedRoot ? '已确认' : '待选择' }}
          </span>
        </div>

        <p v-if="store.selectedRoot" class="inline-path">
          当前目录：<code>{{ store.selectedRoot }}</code>
        </p>
        <p v-else class="tip-box">
          没有自动找到 CS2，请手动选择 Counter-Strike Global Offensive 目录。
        </p>

        <div class="actions-row">
          <button class="primary-button" type="button" @click="handleBrowse">手动选择目录</button>
          <button class="ghost-button" type="button" :disabled="store.busy" @click="store.scanRoots()">自动扫描</button>
          <button class="ghost-button" type="button" :disabled="!store.selectedRoot" @click="refreshAll">
            重新检查
          </button>
        </div>
      </article>

      <article class="card">
        <div class="section-head">
          <div>
            <p class="eyebrow">安装环境</p>
            <h3>安装前摘要</h3>
          </div>
        </div>

        <button class="primary-button install-hero-button" type="button" :disabled="installActionDisabled" @click="handleInstallButton">
          安装人机插件包
        </button>

        <p v-if="store.cs2Running" class="message-line">
          检测到 CS2 正在运行。请先退出游戏，再执行安装或配置写入。
        </p>
        <p v-else-if="store.environment?.baseEnvironmentReady" class="tip-box install-current-package-note">
          基础插件环境已安装，只代表必要目录和文件存在；如果之前装过旧包，仍建议重新安装当前内置 {{ appConfig.appVersion }} 人机插件包。
        </p>
        <p v-else class="tip-box">
          第一屏只显示关键状态；完整文件检查可以在下方展开查看。
        </p>
      </article>
    </div>

    <article v-if="installCompleted || store.environment?.baseEnvironmentReady" class="card next-step-card">
      <div>
        <p class="eyebrow">下一步</p>
        <h3>安装完成后，把启动项和配置补齐。</h3>
        <p class="muted">
          Bot 模式需要在 Steam 的 CS2 启动项中添加 <code>-insecure</code>。之后可以进入游戏配置页调整体验。
        </p>
      </div>
      <div class="actions-row">
        <CopyButton text="-insecure" label="复制 -insecure" copied-label="已复制 -insecure" variant="primary" @copied="handleCopiedLaunchOption" />
        <button class="ghost-button" type="button" @click="router.push('/guide')">查看启动项说明</button>
        <button class="ghost-button" type="button" @click="router.push('/config')">前往游戏配置</button>
      </div>
    </article>

    <CollapsiblePanel
      title="候选目录列表"
      :subtitle="store.candidates.length ? `${store.candidates.length} 个候选目录` : '没有自动找到目录'"
      badge="可切换"
      default-open
    >
      <div v-if="store.candidates.length > 0" class="candidate-list">
        <button
          v-for="candidate in store.candidates"
          :key="candidate.path"
          class="candidate-item"
          type="button"
          :data-active="candidate.path === store.selectedRoot"
          @click="handleSelectCandidate(candidate.path)"
        >
          <strong>{{ candidate.path }}</strong>
          <span>{{ candidate.source }}</span>
        </button>
      </div>
      <p v-else class="muted">暂时没有找到可用目录，请手动选择。</p>
    </CollapsiblePanel>

    <CollapsiblePanel title="修复和恢复" subtitle="目录不对、环境缺失或安装失败时从这里处理" badge="自检">
      <div class="repair-action-grid">
        <button
          v-for="item in repairActions"
          :key="item.title"
          class="repair-action-card"
          type="button"
          :disabled="item.disabled"
          @click="item.action"
        >
          <strong>{{ item.title }}</strong>
          <span>{{ item.description }}</span>
        </button>
      </div>
      <div v-if="preferences.restorePoints.length > 0" class="restore-list">
        <p class="eyebrow">最近恢复点</p>
        <div v-for="point in preferences.restorePoints.slice(0, 3)" :key="point.id" class="restore-item">
          <strong>{{ point.operation }}</strong>
          <span>{{ point.scope }}</span>
          <small>{{ point.at }}</small>
        </div>
      </div>
    </CollapsiblePanel>

    <CollapsiblePanel title="完整检查结果" subtitle="展开查看每个文件和目录是否存在" :badge="statusRows.length ? '已检查' : '待检查'">
      <div v-if="statusRows.length > 0" class="status-list">
        <div v-for="row in visibleStatusRows" :key="row.label" class="status-row">
          <span>{{ row.label }}</span>
          <strong :data-ok="row.value">{{ row.value ? '已找到' : '未找到' }}</strong>
        </div>
        <div class="status-list__controls">
          <button v-if="hasMoreStatusRows" class="ghost-button" type="button" @click="showMoreStatusRows">
            继续展开
          </button>
          <button v-if="visibleStatusCount > 5" class="ghost-button" type="button" @click="collapseStatusRows">
            收起
          </button>
          <span class="muted">已显示 {{ visibleStatusRows.length }} / {{ statusRows.length }} 项</span>
        </div>
      </div>
      <p v-else class="muted">选好目录后，这里会显示检查结果。</p>
    </CollapsiblePanel>

    <div class="actions-row">
      <button class="ghost-button" type="button" @click="diagnosticsOpen = true">查看日志和诊断</button>
    </div>

    <ActionModal
      :open="installConfirmOpen"
      title="安装前确认"
      subtitle="安装会写入当前 CS2 目录，Steam 启动项仍需要手动处理。"
      confirm-label="确认安装"
      :confirm-disabled="!installChecklistComplete || !canInstall"
      @close="closeInstallConfirm"
      @confirm="handleInstall"
    >
      <div class="checklist">
        <label class="check-item">
          <input v-model="confirmExited" type="checkbox" />
          <span>我确认已经退出 CS2。</span>
        </label>
        <label class="check-item">
          <input v-model="confirmRoot" type="checkbox" />
          <span>我确认选择的是 CS2 根目录，不是 game 或 csgo 子目录。</span>
        </label>
        <label class="check-item">
          <input v-model="confirmLaunchOption" type="checkbox" />
          <span>我知道 Bot 模式需要在 Steam 启动项添加 -insecure。</span>
        </label>
      </div>
      <div class="tip-box">
        <p>安装会写入当前 CS2 目录。</p>
        <p>已有用户配置会尽量保留，尤其是 <code>addons/counterstrikesharp/configs/plugins/</code>。</p>
        <p>安装后需要手动处理 Steam 启动项。</p>
      </div>
      <p class="inline-path">
        目标位置：<code>{{ store.selectedRoot || '你的 CS2 目录' }}\game\csgo</code>
      </p>
    </ActionModal>

    <ActionModal
      :open="diagnosticsOpen"
      title="日志位置和详细诊断"
      cancel-label="关闭"
      hide-confirm
      @close="diagnosticsOpen = false"
      @confirm="diagnosticsOpen = false"
    >
      <p v-if="store.diagnostics?.logPath" class="inline-path">
        日志位置：<code>{{ store.diagnostics.logPath }}</code>
      </p>
      <p v-else class="muted">当前没有读取到日志路径。</p>
      <div v-if="statusRows.length > 0" class="status-list">
        <div v-for="row in statusRows" :key="`diagnostic:${row.label}`" class="status-row">
          <span>{{ row.label }}</span>
          <strong :data-ok="row.value">{{ row.value ? '已找到' : '未找到' }}</strong>
        </div>
      </div>
    </ActionModal>
  </section>
</template>
