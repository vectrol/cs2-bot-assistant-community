<script setup lang="ts">
import { computed, inject, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { open } from '@tauri-apps/plugin-dialog'
import { useI18n } from 'vue-i18n'

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

const { t } = useI18n()
const store = useCs2Store()
const preferences = useUiPreferencesStore()
const router = useRouter()
const openLaunchGameModalFn = inject<() => void>('openLaunchGameModal', () => {})
const installConfirmOpen = ref(false)
const diagnosticsOpen = ref(false)
const installCompleted = ref(false)
const confirmExited = ref(false)
const confirmRoot = ref(false)
const confirmLaunchOption = ref(false)
const visibleStatusCount = ref(5)
const currentResourcePackageLabel = computed(() => `${t('install.currentPackage')} ${appConfig.appVersion}`)

const statusRows = computed(() => {
  if (!store.environment) return []
  const e = store.environment
  return [
    { label: 'game', value: e.gameDirExists },
    { label: 'csgo', value: e.csgoDirExists },
    { label: 'MetaMod', value: e.metamodExists },
    { label: 'CounterStrikeSharp', value: e.counterstrikeSharpExists },
    { label: 'gameinfo.gi', value: e.gameinfoExists },
    { label: 'overrides/botprofile.vpk', value: e.activeBotprofileExists },
    { label: 'backup/Online/gameinfo.gi', value: e.backupOnlineGameinfoExists },
    { label: 'backup/WithBots/gameinfo.gi', value: e.backupWithbotsGameinfoExists },
    { label: 'overrides/Low/botprofile.vpk', value: e.lowProfileExists },
    { label: 'overrides/Medium/botprofile.vpk', value: e.mediumProfileExists },
    { label: 'overrides/High/botprofile.vpk', value: e.highProfileExists },
    { label: 'BotHider', value: e.botHiderExists },
    { label: 'RayTrace', value: e.rayTraceExists },
    { label: 'core.json', value: e.coreConfigExists },
    { label: 'BotHiderImpl', value: e.botHiderImplExists },
    { label: 'RayTraceImpl', value: e.rayTraceImplExists },
    { label: 'RoundDamageRecap', value: e.roundDamageRecapExists },
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

const canInstall = computed(() => Boolean(store.selectedRoot) && !store.cs2Running && !store.busy)

const installBlockReason = computed(() => {
  if (!store.selectedRoot) return t('install.noRootMsg')
  if (store.cs2Running) return t('install.cs2RunningMsg')
  return ''
})

const primaryStatusMessage = computed(() => {
  if (store.cs2Running) return t('install.cs2RunningMsg')
  if (!store.selectedRoot) return t('install.noRootMsg')
  if (store.environment?.baseEnvironmentReady) return t('install.envReady')
  return t('install.dirReady')
})

const installActionHint = computed(() => {
  if (installBlockReason.value) return installBlockReason.value
  if (store.environment?.baseEnvironmentReady) return t('install.overwriteHint')
  return t('install.installSafeDesc')
})

const installActionDisabled = computed(() => store.busy || Boolean(installBlockReason.value))

const summaryItems = computed(() => [
  { label: t('install.summaryRoot'), value: store.selectedRoot || t('install.notSelected'), state: store.selectedRoot ? 'ready' as const : 'warn' as const },
  { label: t('install.summaryEnv'), value: store.environment?.baseEnvironmentReady ? t('install.complete') : t('install.pending'), state: store.environment?.baseEnvironmentReady ? 'ready' as const : 'warn' as const },
  { label: t('install.summaryProcess'), value: store.cs2Running ? t('install.running') : t('install.notRunning'), state: store.cs2Running ? 'danger' as const : 'ready' as const },
  { label: t('install.summaryAction'), value: installBlockReason.value || t('install.installAction'), state: store.cs2Running ? 'danger' as const : store.selectedRoot ? 'ready' as const : 'warn' as const },
])

const stepperItems = computed(() => [
  {
    title: t('install.stepperTitle1'),
    description: store.selectedRoot || t('install.stepperDesc1'),
    state: store.selectedRoot ? 'complete' as const : 'current' as const,
  },
  {
    title: t('install.stepperTitle2'),
    description: store.environment?.baseEnvironmentReady ? t('install.stepperDesc2Ready') : t('install.stepperDesc2'),
    state: store.environment?.baseEnvironmentReady ? 'complete' as const : store.selectedRoot ? 'current' as const : 'pending' as const,
  },
  {
    title: t('install.stepperTitle3'),
    description: t('install.stepperDesc3'),
    state: store.environment?.baseEnvironmentReady ? 'manual' as const : 'pending' as const,
  },
])

const installChecklistComplete = computed(() => confirmExited.value && confirmRoot.value && confirmLaunchOption.value)

const readinessRows = computed(() => [
  { label: t('install.confirmRoot'), value: store.selectedRoot ? t('install.dirSelected') : t('install.notSelected'), state: store.selectedRoot ? 'ready' as const : 'warn' as const },
  { label: t('install.envReady'), value: store.environment?.baseEnvironmentReady ? t('install.complete') : t('install.pending'), state: store.environment?.baseEnvironmentReady ? 'ready' as const : 'warn' as const },
  { label: t('install.cs2Status'), value: store.cs2Running ? t('install.running') : t('install.notRunning'), state: store.cs2Running ? 'danger' as const : 'ready' as const },
  { label: t('install.currentAction'), value: store.cs2Running ? t('install.cs2RunningMsg') : store.selectedRoot ? t('install.ready') : t('install.notSelected'), state: store.cs2Running ? 'danger' as const : store.selectedRoot ? 'ready' as const : 'warn' as const },
])

const repairActions = computed(() => [
  { title: t('install.repairAction1'), description: store.selectedRoot ? t('install.repairAction1Desc') : t('install.repairAction1NoDir'), disabled: !store.selectedRoot || store.busy, action: refreshAll },
  { title: t('install.repairAction2'), description: t('install.repairAction2Desc'), disabled: store.busy, action: scanAndRemember },
  { title: t('install.repairAction3'), description: t('install.repairAction3Desc'), disabled: !canInstall.value, action: () => { installConfirmOpen.value = true } },
])

async function handleBrowse() {
  try {
    const result = await open({ directory: true, multiple: false, title: 'Select CS2 Directory' })
    if (typeof result === 'string') {
      await store.selectRoot(result)
      preferences.setLastSelectedRoot(store.selectedRoot)
      preferences.recordAction(t('install.selectRoot'), store.selectedRoot)
      await store.refreshDiagnostics()
      installCompleted.value = false
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
    preferences.recordAction(t('install.recheck'), store.selectedRoot || t('install.notSelected'))
  } catch (error) {
    const message = store.normalizeError(error)
    preferences.recordError(message, t('install.recheck'))
    store.setMessage(message)
  }
}

async function scanAndRemember() {
  try {
    await store.scanRoots()
    if (store.selectedRoot) preferences.setLastSelectedRoot(store.selectedRoot)
  } catch (error) {
    const message = store.normalizeError(error)
    preferences.recordError(message, t('install.autoScan'))
    store.setMessage(message)
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
  if (!canInstall.value) return
  installConfirmOpen.value = true
}

async function handleSelectCandidate(path: string) {
  try {
    await store.selectRoot(path)
    preferences.setLastSelectedRoot(store.selectedRoot)
    preferences.recordAction('switchDir', store.selectedRoot)
    await store.refreshDiagnostics()
    installCompleted.value = false
  } catch (error) {
    store.setMessage(store.normalizeError(error))
  }
}

async function handleInstall() {
  if (!installChecklistComplete.value || !canInstall.value) return
  try {
    preferences.createRestorePoint(t('install.installPack'), store.selectedRoot, t('install.installNotice2'), false)
    await store.install()
    preferences.recordAction(t('install.installPack'), store.selectedRoot)
    installCompleted.value = true
    closeInstallConfirm()
    await refreshAll()
  } catch (error) {
    const message = store.normalizeError(error)
    preferences.recordError(message, t('install.installPack'))
    store.setMessage(message)
  } finally {
    await store.refreshDiagnostics()
  }
}

function handleCopiedLaunchOption() {
  preferences.recordAction(t('install.copyInsecure'), '-insecure')
}

async function handleOpenDemos() {
  try {
    await store.openReplays()
    if (store.demoDiscovery?.recentDemo) preferences.setLastDemoPath(store.demoDiscovery.recentDemo.path)
  } catch (error) {
    const message = store.normalizeError(error)
    preferences.recordError(message, 'openDemoDir')
    store.setMessage(message)
  }
}

function openLaunchGameModal() {
  openLaunchGameModalFn()
}

onMounted(async () => {
  preferences.load()
  try {
    await store.scanRoots()
    await store.refreshCs2Running()
    await store.refreshDiagnostics()
  } catch (error) {
    const message = store.normalizeError(error)
    preferences.recordError(message, 'enterInstallPage')
    store.setMessage(message)
  }
})
</script>

<template>
  <section class="page-grid install-console-page">
    <section class="ops-overview">
      <ConsolePanel
        :eyebrow="t('install.title')"
        :title="t('install.pageTitle')"
        :description="primaryStatusMessage"
        tone="strong"
      >
        <template #actions>
          <button class="ghost-button" type="button" @click="handleBrowse">
            {{ store.selectedRoot ? t('install.reselectRoot') : t('install.selectRoot') }}
          </button>
          <button class="ghost-button" type="button" :disabled="store.busy" @click="refreshAll">{{ t('install.recheck') }}</button>
        </template>
        <div class="install-action-dock">
          <div>
            <p class="install-hero-hint" :data-state="store.environment?.baseEnvironmentReady ? 'ready' : installBlockReason ? 'warn' : 'info'">
              {{ installActionHint }}
            </p>
          </div>
          <button class="primary-button install-hero-button" type="button" :disabled="installActionDisabled" @click="handleInstallButton">
            {{ t('install.installBtn') }}
          </button>
        </div>
        <div class="metric-grid">
          <MetricTile v-for="item in summaryItems" :key="item.label" :label="item.label" :value="item.value" :state="item.state" />
        </div>
      </ConsolePanel>

      <ConsolePanel :eyebrow="t('install.checklistTitle')" :title="t('install.checklistTitle')" :description="t('install.checklistDesc')">
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
            <p class="eyebrow">{{ t('install.currentDir') }}</p>
            <h3>{{ t('install.currentDir') }}</h3>
          </div>
          <span class="status-badge" :data-state="store.selectedRoot ? 'ready' : 'warn'">
            {{ store.selectedRoot ? t('install.dirSelected') : t('install.notSelected') }}
          </span>
        </div>
        <p v-if="store.selectedRoot" class="inline-path">{{ t('install.currentDirValue', { path: store.selectedRoot }) }}</p>
        <p v-else class="tip-box">{{ t('install.noDirAuto') }}</p>
        <div class="actions-row">
          <button class="primary-button" type="button" @click="handleBrowse">{{ t('install.manualSelect') }}</button>
          <button class="ghost-button" type="button" :disabled="store.busy" @click="store.scanRoots()">{{ t('install.autoScan') }}</button>
          <button class="ghost-button" type="button" :disabled="!store.selectedRoot" @click="refreshAll">{{ t('install.recheck') }}</button>
        </div>
      </article>

      <article class="card">
        <div class="section-head">
          <div>
            <p class="eyebrow">{{ t('install.envSummary') }}</p>
            <h3>{{ t('install.envSummary') }}</h3>
          </div>
        </div>
        <button class="primary-button install-hero-button" type="button" :disabled="installActionDisabled" @click="handleInstallButton">
          {{ t('install.installBtn') }}
        </button>
        <p v-if="store.cs2Running" class="message-line">{{ t('install.cs2RunningNotice') }}</p>
        <p v-else-if="store.environment?.baseEnvironmentReady" class="tip-box install-current-package-note">{{ t('install.envRecommend') }}</p>
        <p v-else class="tip-box">{{ t('install.envFirstScreen') }}</p>
      </article>
    </div>

    <article v-if="installCompleted || store.environment?.baseEnvironmentReady" class="card next-step-card">
      <div>
        <p class="eyebrow">{{ t('install.nextStep') }}</p>
        <h3>{{ t('install.nextStepDesc') }}</h3>
        <p class="muted">{{ t('install.nextStepHint') }}</p>
      </div>
      <div class="actions-row">
        <CopyButton text="-insecure" :label="t('install.copyInsecure')" :copied-label="t('install.copiedInsecure')" variant="primary" @copied="handleCopiedLaunchOption" />
        <button class="ghost-button" type="button" @click="router.push('/guide')">{{ t('install.viewLaunchHelp') }}</button>
        <button class="ghost-button" type="button" @click="router.push('/config')">{{ t('install.goToConfig') }}</button>
      </div>
    </article>

    <CollapsiblePanel
      :title="t('install.candidateTitle')"
      :subtitle="store.candidates.length ? t('install.candidateSubtitle', { n: store.candidates.length }) : t('install.candidateEmpty')"
      :badge="t('install.candidateSwitch')"
      default-open
    >
      <div v-if="store.candidates.length > 0" class="candidate-list">
        <button v-for="candidate in store.candidates" :key="candidate.path" class="candidate-item" type="button" :data-active="candidate.path === store.selectedRoot" @click="handleSelectCandidate(candidate.path)">
          <strong>{{ candidate.path }}</strong>
          <span>{{ candidate.source }}</span>
        </button>
      </div>
      <p v-else class="muted">{{ t('install.candidateEmpty') }}</p>
    </CollapsiblePanel>

    <CollapsiblePanel :title="t('install.repairTitle')" :subtitle="t('install.repairSubtitle')" :badge="t('install.repairBadge')">
      <div class="repair-action-grid">
        <button v-for="item in repairActions" :key="item.title" class="repair-action-card" type="button" :disabled="item.disabled" @click="item.action">
          <strong>{{ item.title }}</strong>
          <span>{{ item.description }}</span>
        </button>
      </div>
      <div v-if="preferences.restorePoints.length > 0" class="restore-list">
        <p class="eyebrow">{{ t('install.recentRestore') }}</p>
        <div v-for="point in preferences.restorePoints.slice(0, 3)" :key="point.id" class="restore-item">
          <strong>{{ point.operation }}</strong>
          <span>{{ point.scope }}</span>
          <small>{{ point.at }}</small>
        </div>
      </div>
    </CollapsiblePanel>

    <CollapsiblePanel :title="t('install.fullCheckTitle')" :subtitle="t('install.fullCheckSubtitle')" :badge="statusRows.length ? t('install.fullCheckBadgeChecked') : t('install.fullCheckBadgePending')">
      <div v-if="statusRows.length > 0" class="status-list">
        <div v-for="row in visibleStatusRows" :key="row.label" class="status-row">
          <span>{{ row.label }}</span>
          <strong :data-ok="row.value">{{ row.value ? t('install.found') : t('install.notFound') }}</strong>
        </div>
        <div class="status-list__controls">
          <button v-if="hasMoreStatusRows" class="ghost-button" type="button" @click="showMoreStatusRows">{{ t('install.showMore') }}</button>
          <button v-if="visibleStatusCount > 5" class="ghost-button" type="button" @click="collapseStatusRows">{{ t('install.collapse') }}</button>
          <span class="muted">{{ t('install.shownCount', { visible: visibleStatusRows.length, total: statusRows.length }) }}</span>
        </div>
      </div>
      <p v-else class="muted">{{ t('install.noCheckResults') }}</p>
    </CollapsiblePanel>

    <div class="actions-row">
      <button class="ghost-button" type="button" @click="diagnosticsOpen = true">{{ t('install.logsAndDiagnostics') }}</button>
    </div>

    <ActionModal
      :open="installConfirmOpen"
      :title="t('install.installConfirmTitle')"
      :subtitle="t('install.installConfirmSub')"
      :confirm-label="t('install.installConfirmBtn')"
      :confirm-disabled="!installChecklistComplete || !canInstall"
      @close="closeInstallConfirm"
      @confirm="handleInstall"
    >
      <div class="checklist">
        <label class="check-item"><input v-model="confirmExited" type="checkbox" /> <span>{{ t('install.confirmExited') }}</span></label>
        <label class="check-item"><input v-model="confirmRoot" type="checkbox" /> <span>{{ t('install.confirmRoot') }}</span></label>
        <label class="check-item"><input v-model="confirmLaunchOption" type="checkbox" /> <span>{{ t('install.confirmLaunchOption') }}</span></label>
      </div>
      <div class="tip-box">
        <p>{{ t('install.installNotice1') }}</p>
        <p>{{ t('install.installNotice2') }}</p>
        <p>{{ t('install.installNotice3') }}</p>
      </div>
      <p class="inline-path">{{ t('install.targetPath', { path: (store.selectedRoot || 'your CS2 dir') + '\\game\\csgo' }) }}</p>
    </ActionModal>

    <ActionModal
      :open="diagnosticsOpen"
      :title="t('install.diagnosticsTitle')"
      :cancel-label="t('install.diagnosticsClose')"
      hide-confirm
      @close="diagnosticsOpen = false"
      @confirm="diagnosticsOpen = false"
    >
      <p v-if="store.diagnostics?.logPath" class="inline-path">{{ t('install.logPath', { path: store.diagnostics.logPath }) }}</p>
      <p v-else class="muted">{{ t('install.noLogPath') }}</p>
      <div v-if="statusRows.length > 0" class="status-list">
        <div v-for="row in statusRows" :key="`diagnostic:${row.label}`" class="status-row">
          <span>{{ row.label }}</span>
          <strong :data-ok="row.value">{{ row.value ? t('install.found') : t('install.notFound') }}</strong>
        </div>
      </div>
    </ActionModal>
  </section>
</template>
