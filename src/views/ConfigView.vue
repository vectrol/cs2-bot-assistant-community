<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

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
const { t } = useI18n()
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
  { title: t('config.difficultyEasy'), preset: 'low', description: t('config.difficultyEasyDesc') },
  { title: t('config.difficultyStandard'), preset: 'medium', description: t('config.difficultyStandardDesc') },
  { title: t('config.difficultyHard'), preset: 'high', description: t('config.difficultyHardDesc') },
]

const modeCards: Array<{ title: string; preset: GameModePreset; description: string }> = [
  { title: t('config.modeOnline'), preset: 'online', description: t('config.modeOnlineDesc') },
  { title: t('config.modeBots'), preset: 'withBots', description: t('config.modeBotsDesc') },
]

const blockedReason = computed(() => {
  if (!store.selectedRoot) {
    return t('config.blockedNoDir')
  }
  if (!store.readyForConfig) {
    return t('config.blockedNotReady')
  }
  if (store.cs2Running) {
    return t('config.blockedCs2Running')
  }
  return ''
})

const nadeRecoveryFields = [
  { key: 'flash', label: t('config.nadeFlash'), hint: t('config.nadeFlashHint') },
  { key: 'smoke', label: t('config.nadeSmoke'), hint: t('config.nadeSmokeHint') },
  { key: 'he', label: t('config.nadeHe'), hint: t('config.nadeHeHint') },
  { key: 'molotov', label: t('config.nadeMolotov'), hint: t('config.nadeMolotovHint') },
  { key: 'incgrenade', label: t('config.nadeInc'), hint: t('config.nadeIncHint') },
] as const

const nadeRecoveryStatus = computed(() => {
  if (!store.nadeRecoveryConfig) {
    return t('config.nadeHint')
  }
  if (!store.nadeRecoveryConfig.exists) {
    return t('config.nadeNotFound')
  }
  return t('config.nadePath', { path: store.nadeRecoveryConfig.configPath })
})

const recentDemo = computed(() => store.demoDiscovery?.recentDemo ?? null)

const statusItems = computed(() => [
  {
    label: t('config.selectDir'),
    value: store.selectedRoot ? t('config.selected') : t('config.notSelected'),
    state: store.selectedRoot ? 'ready' as const : 'warn' as const,
  },
  {
    label: t('config.environment'),
    value: store.readyForConfig ? t('config.configurable') : t('config.notReady'),
    state: store.readyForConfig ? 'ready' as const : 'warn' as const,
  },
  {
    label: 'CS2',
    value: store.cs2Running ? t('config.running') : t('config.notRunning'),
    state: store.cs2Running ? 'danger' as const : 'ready' as const,
  },
])

const demoStatus = computed(() => {
  if (!store.selectedRoot) {
    return t('config.demoNoRoot')
  }
  if (!store.demoDiscovery) {
    return t('config.demoNotChecked')
  }
  if (!store.demoDiscovery.recentDemo) {
    return t('config.demoNotFound', { dir: store.demoDiscovery.defaultDirectory })
  }
  return t('config.demoRecent', { name: store.demoDiscovery.recentDemo.fileName })
})

const recentConfigItems = computed(() => preferences.recentActions
  .filter((item) => ['Apply Difficulty', 'Switch Mode', 'Save Nade Recovery'].includes(item.label))
  .slice(0, 4))

const configSections = computed(() => [
  { key: 'base' as const, label: t('config.sectionBasic'), detail: blockedReason.value || `${t('config.difficultyEasy')}/${t('config.difficultyStandard')}/${t('config.difficultyHard')}` },
  { key: 'nades' as const, label: t('config.sectionNades'), detail: store.nadeRecoveryConfig?.exists ? t('config.nadeFound') : t('config.nadeEditable') },
  { key: 'demo' as const, label: t('config.sectionDemo'), detail: recentDemo.value?.fileName ?? t('config.demoOps') },
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
    preferences.createRestorePoint('Apply Bot Difficulty', store.selectedRoot, `Applying difficulty: ${preset}`, false)
    await store.applyDifficulty(preset)
    preferences.recordAction('Apply Difficulty', preset)
  } catch (error) {
    const message = store.normalizeError(error)
    preferences.recordError(message, 'Apply Bot Difficulty')
    store.setMessage(t('config.toast.recheckAndExit', { msg: message }))
  }
}

async function switchMode(preset: GameModePreset) {
  if (!canWriteConfig()) {
    return
  }
  try {
    preferences.createRestorePoint('Switch Game Mode', store.selectedRoot, `Mode switch: ${preset}`, false)
    await store.switchGameMode(preset)
    preferences.recordAction('Switch Mode', preset === 'online' ? 'Online Mode' : 'Bot Mode')
  } catch (error) {
    const message = store.normalizeError(error)
    preferences.recordError(message, 'Switch Game Mode')
    store.setMessage(t('config.toast.exitAndRecheck', { msg: message }))
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
    preferences.recordError(message, 'Read Nade Recovery Config')
    store.setMessage(t('config.toast.reloadOrDiagnose', { msg: message }))
  }
}

async function saveNadeRecovery() {
  if (!canWriteConfig()) {
    return false
  }
  try {
    preferences.createRestorePoint('Save Nade Recovery Time', store.selectedRoot, 'Write nade suppression times to NadeSystem.json', false)
    await store.saveNadeRecovery(nadeRecovery.value)
    preferences.recordAction('Save Nade Recovery', nadeRecoveryLoadedPath.value || store.selectedRoot)
    return true
  } catch (error) {
    const message = store.normalizeError(error)
    preferences.recordError(message, 'Save Nade Recovery Time')
    store.setMessage(t('config.toast.confirmExitAndReload', { msg: message }))
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
    preferences.recordError(message, 'Reset Nade Recovery Config')
    store.setMessage(t('config.toast.reloadAndRetry', { msg: message }))
  }
}

function handleWorkshopCopied() {
  preferences.recordAction('Copy Launch Option', '-disable_workshop_command_filtering')
  store.setMessage(t('config.toast.launchOptCopied'))
}

function handleDemoCommandCopied() {
  preferences.recordAction('Copy Demo Command', 'tv_enable 1; tv_autorecord 1')
  store.setMessage(t('config.toast.consoleCmdCopied'))
}

async function refreshRecentDemo() {
  try {
    await store.refreshDemos()
    if (store.demoDiscovery?.recentDemo) {
      preferences.setLastDemoPath(store.demoDiscovery.recentDemo.path)
    }
    preferences.recordAction('Find Recent Demo', store.demoDiscovery?.recentDemo?.fileName ?? 'No demo found')
  } catch (error) {
    const message = store.normalizeError(error)
    preferences.recordError(message, 'Find Recent Demo')
    store.setMessage(t('config.toast.demoDirMissing', { msg: message }))
  }
}

async function refreshRecentDemoAndShow() {
  await refreshRecentDemo()
  demoDetailModalOpen.value = true
}

function handleDemoPathCopied(text: string) {
  preferences.setLastDemoPath(text)
  preferences.recordAction('Copy Demo Path', text)
  store.setMessage(t('config.toast.demoPathCopied', { path: text }))
}

async function openRecentDemoDirectory() {
  try {
    await store.openReplays()
    preferences.recordAction('Open Demo Dir', store.selectedRoot || 'No directory selected')
  } catch (error) {
    const message = store.normalizeError(error)
    preferences.recordError(message, 'Open Demo Dir')
    store.setMessage(t('config.toast.returnAndRecheck', { msg: message }))
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
    preferences.recordError(message, 'Open Demo Folder')
    store.setMessage(t('config.toast.openDemoDirAndSearch', { msg: message }))
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
    preferences.recordError(message, 'Enter Config Page')
    store.setMessage(message)
  }
})

</script>

<template>
  <section class="page-grid config-console-page">
    <ConsolePanel
      :eyebrow="t('config.title')"
      :title="t('config.title')"
      :description="blockedReason || t('config.description')"
      tone="strong"
      class="glass"
    >
      <template #actions>
        <button class="ghost-button" @click="store.refreshCs2Running()">{{ t('app.refresh') }}</button>
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

    <article class="card config-section-tabs glass" :aria-label="t('config.title')">
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
          <p class="eyebrow">{{ t('config.recentChanges') }}</p>
          <h3>{{ t('config.recentChangesDesc') }}</h3>
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
            <p class="eyebrow">{{ t('quickControl.difficulty') }}</p>
            <h3>{{ t('config.difficultyChoose') }}</h3>
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
            <p class="eyebrow">{{ t('config.modeSwitch') }}</p>
            <h3>{{ t('config.modeSwitchDesc') }}</h3>
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
      :title="t('config.sectionNades')"
      :description="nadeRecoveryStatus"
      :badge="store.nadeRecoveryConfig?.exists ? t('config.nadeFound') : t('config.nadeEditable')"
      :default-open="false"
    >
      <ConfigActionGroup
        :primary-label="t('app.edit')"
        :reset-label="t('config.resetDefault')"
        :primary-disabled="Boolean(blockedReason)"
        :secondary-disabled="!store.selectedRoot"
        :reset-disabled="Boolean(blockedReason)"
        :busy="store.busy"
        @primary="nadeRecoveryModalOpen = true"
        @secondary="refreshNadeRecoveryConfig"
        @reset="resetNadeRecovery"
      />
      <p v-if="nadeRecoveryLoadedPath && store.nadeRecoveryConfig?.exists" class="inline-path">
        {{ t('config.nadePath', { path: nadeRecoveryLoadedPath }) }}
      </p>
    </ConfigSection>

    <ConfigSection v-show="activeConfigSection === 'demo'" :title="t('config.sectionDemo')" :description="demoStatus" :badge="t('config.demoBadge')" :default-open="true">
      <div class="match-record-grid">
        <div class="manual-item">
          <strong>{{ t('config.demoRecordToggle') }}</strong>
          <div class="copy-row">
            <code>tv_enable 1; tv_autorecord 1</code>
            <CopyButton text="tv_enable 1; tv_autorecord 1" :label="t('app.copy')" :copied-label="t('app.copied')" @copied="handleDemoCommandCopied" />
          </div>
          <p class="muted">{{ t('config.demoRecordHint') }}</p>
        </div>

        <div class="manual-item">
          <strong>{{ t('config.demoWorkshop') }}</strong>
          <div class="copy-row">
            <code>-disable_workshop_command_filtering</code>
            <CopyButton text="-disable_workshop_command_filtering" @copied="handleWorkshopCopied" />
          </div>
          <p class="muted">{{ t('config.demoWorkshopHint') }}</p>
        </div>

        <div class="manual-item">
          <strong>{{ t('config.demoModeSwitch') }}</strong>
          <p class="muted">{{ t('config.demoModeSwitchHint') }}</p>
        </div>

        <div class="manual-item">
          <div class="section-head">
            <strong>{{ t('config.recentDemo') }}</strong>
            <div class="demo-actions">
              <button class="ghost-button" :disabled="!store.selectedRoot || store.busy" @click="refreshRecentDemoAndShow">{{ t('app.refresh') }}</button>
              <button class="ghost-button" :disabled="!store.selectedRoot || store.busy" @click="openRecentDemoDirectory">{{ t('config.openDirectory') }}</button>
            </div>
          </div>
          <div v-if="recentDemo" class="recent-demo-card">
            <div class="demo-info">
              <code>{{ recentDemo.fileName }}</code>
              <span class="muted">{{ recentDemo.modifiedAt }}</span>
            </div>
            <div class="demo-actions">
              <CopyButton :text="recentDemo.path" @copied="handleDemoPathCopied(recentDemo.path)" />
              <button class="ghost-button" @click="openRecentDemoFolder">{{ t('config.openFolder') }}</button>
            </div>
          </div>
          <p v-else class="muted">{{ t('config.demoNoRecent') }}</p>
        </div>
      </div>
    </ConfigSection>

    <ConfigEditorModal
      :open="nadeRecoveryModalOpen"
      :title="t('config.nadeModalTitle')"
      :description="t('config.nadeModalDesc')"
      :save-label="t('config.saveNade')"
      :save-disabled="Boolean(blockedReason) || store.busy"
      :loading="store.busy"
      @close="nadeRecoveryModalOpen = false"
      @save="saveNadeRecoveryAndClose"
    >
      <div class="form-grid nade-recovery-form">
        <div v-for="field in nadeRecoveryFields" :key="field.key" class="field range-field">
          <div class="range-field__head">
            <span>{{ field.label }}</span>
            <strong>{{ nadeRecovery[field.key].toFixed(2) }}s</strong>
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
          {{ t('config.resetDefault') }}
        </button>
      </template>
    </ConfigEditorModal>

    <ActionModal
      :open="demoDetailModalOpen"
      :title="t('config.demoDetailTitle')"
      :subtitle="demoStatus"
      :cancel-label="t('app.close')"
      hide-confirm
      @close="demoDetailModalOpen = false"
      @confirm="demoDetailModalOpen = false"
    >
      <div class="demo-result">
        <template v-if="recentDemo">
          <dl>
            <div>
              <dt>{{ t('config.demoFileLabel') }}</dt>
              <dd>{{ recentDemo.fileName }}</dd>
            </div>
            <div>
              <dt>{{ t('config.demoTimeLabel') }}</dt>
              <dd>{{ recentDemo.modifiedAt }}</dd>
            </div>
            <div>
              <dt>{{ t('config.demoDirLabel') }}</dt>
              <dd><code>{{ recentDemo.directoryPath }}</code></dd>
            </div>
            <div>
              <dt>{{ t('config.demoFullPathLabel') }}</dt>
              <dd><code>{{ recentDemo.path }}</code></dd>
            </div>
          </dl>
          <div class="copy-row">
            <CopyButton :text="recentDemo.path" :label="t('config.copyDemoPath')" :copied-label="t('app.copied')" @copied="handleDemoPathCopied" />
            <button class="ghost-button" @click="openRecentDemoFolder">
              {{ t('config.openFolder') }}
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
