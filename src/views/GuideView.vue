<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { open } from '@tauri-apps/plugin-dialog'
import { useI18n } from 'vue-i18n'

import ActionModal from '@/components/ActionModal.vue'
import DiagnosticsPanel from '@/components/DiagnosticsPanel.vue'
import InlineNotice from '@/components/ui/InlineNotice.vue'
import { openDiagnosticsLogDirectory } from '@/services/tauri/cs2'
import { useCs2Store } from '@/stores/cs2'
import { useUiPreferencesStore } from '@/stores/ui-preferences'

const { t, tm } = useI18n()
const store = useCs2Store()
const preferences = useUiPreferencesStore()
const uninstallModalOpen = ref(false)
const installConfirmOpen = ref(false)
const confirmExited = ref(false)
const confirmRoot = ref(false)

const statusGrid = computed(() => {
  if (!store.environment) return []
  const e = store.environment
  return [
    { label: 'game', ok: e.gameDirExists }, { label: 'csgo', ok: e.csgoDirExists },
    { label: 'MetaMod', ok: e.metamodExists }, { label: 'CSS', ok: e.counterstrikeSharpExists },
    { label: 'gameinfo.gi', ok: e.gameinfoExists }, { label: 'botprofile', ok: e.activeBotprofileExists },
    { label: 'BotHider', ok: e.botHiderExists }, { label: 'RayTrace', ok: e.rayTraceExists },
    { label: t('diagnostics.checks.coreConfig'), ok: e.coreConfigExists },
    { label: 'Inventory', ok: e.inventorySimulatorExists },
  ]
})

const canInstall = computed(() => store.selectedRoot && !store.cs2Running && store.environment)
const installStatus = computed(() => {
  if (!store.environment) return ''
  return store.environment.baseEnvironmentReady ? t('guide.installedReinstall') : t('guide.notInstalled')
})

function selectDirectory(path: string) {
  store.selectRoot(path)
  store.refreshEnvironment()
}

async function browseDirectory() {
  const dir = await open({ directory: true, multiple: false, title: t('guide.selectRootHint') })
  if (dir) selectDirectory(dir as string)
}

async function scanRoots() {
  await store.scanRoots()
}

function canWrite() {
  if (store.cs2Running) { store.setMessage(t('guide.cs2RunningMsg')); return false }
  if (!store.selectedRoot) { store.setMessage(t('guide.selectDirFirst')); return false }
  return true
}

async function installPackage() {
  if (!canWrite()) return
  try {
    const result = await store.install()
    store.setMessage(result.message)
    installConfirmOpen.value = false
    await refreshAll()
  } catch (error) {
    store.setMessage(store.normalizeError(error))
  }
}

async function uninstallBotPackage() {
  try {
    await store.uninstall()
    uninstallModalOpen.value = false
    await refreshAll()
  } catch (error) {
    store.setMessage(store.normalizeError(error))
  }
}

async function refreshAll() {
  await store.refreshCs2Running()
  if (store.selectedRoot) await store.refreshEnvironment()
  await store.refreshDiagnostics()
  preferences.recordAction(t('guide.refreshAction'), store.selectedRoot || t('guide.notSelected'))
}

async function openLogs() {
  try {
    const result = await openDiagnosticsLogDirectory()
    store.setMessage(result.message)
  } catch (error) {
    store.setMessage(store.normalizeError(error))
  }
}

onMounted(async () => {
  preferences.load()
  if (!store.selectedRoot) await store.scanRoots()
  await refreshAll()
})
</script>

<template>
  <section class="page-grid">
    <article class="hero-banner install-hero glass">
      <div>
        <p class="eyebrow">{{ t('guide.title') }}</p>
        <h2>{{ store.selectedRoot ? t('guide.dirSelected') : t('guide.selectRoot') }}</h2>
        <p class="muted">
          {{ store.selectedRoot ? store.selectedRoot : t('guide.selectRootHint') }}
        </p>
      </div>
      <div class="install-hero__actions">
        <button class="ghost-button" type="button" :disabled="store.busy" @click="scanRoots">{{ t('guide.scanDirectories') }}</button>
        <button class="ghost-button" type="button" @click="browseDirectory">{{ t('guide.browse') }}</button>
        <button
          class="primary-button install-hero-button"
          type="button"
          :disabled="!canInstall"
          @click="installConfirmOpen = true"
        >
          {{ installStatus || t('guide.installPackage') }}
        </button>
      </div>
    </article>

    <div v-if="store.candidates.length > 0" class="install-candidates">
      <p class="eyebrow">{{ t('guide.foundDirectories') }}</p>
      <button
        v-for="c in store.candidates"
        :key="c.path"
        class="candidate-item"
        :data-active="c.path === store.selectedRoot"
        type="button"
        @click="selectDirectory(c.path)"
      >
        <code>{{ c.path }}</code>
        <small>{{ c.source }}</small>
      </button>
    </div>

    <InlineNotice
      v-if="store.cs2Running"
      :message="t('guide.cs2RunningWarn')"
      state="warn"
    />

    <article v-if="store.environment" class="card env-status-card glass">
      <div class="section-head">
        <div>
          <p class="eyebrow">{{ t('guide.environmentTitle') }}</p>
          <h3>{{ t('guide.envCheckTitle') }}</h3>
        </div>
        <span class="status-pill" :data-state="store.environment.baseEnvironmentReady ? 'ready' : 'warn'">
          {{ store.environment.baseEnvironmentReady ? t('guide.environmentReady') : t('guide.environmentIncomplete') }}
        </span>
      </div>
      <div class="env-grid">
        <span v-for="item in statusGrid" :key="item.label" class="env-dot" :data-ok="item.ok">
          <span class="env-dot__indicator" />
          {{ item.label }}
        </span>
      </div>
    </article>

    <DiagnosticsPanel
      :root-path="store.selectedRoot"
      :environment="store.environment"
      :cs2-running="store.cs2Running"
      :diagnostics="store.diagnostics"
      :last-error="preferences.lastError"
      :busy="store.busy"
      @refresh="refreshAll"
      @open-logs="openLogs"
    />

    <section class="faq-grid">
      <article v-for="(section, idx) in tm('guide.faqItems')" :key="idx" class="card faq-item glass">
        <p class="eyebrow">{{ t('guide.faq') }}</p>
        <h3>{{ section.title }}</h3>
        <p class="muted">{{ section.body }}</p>
      </article>
    </section>

    <section class="danger-zone card glass">
      <div class="section-head">
        <div>
          <p class="eyebrow">{{ t('guide.dangerZone') }}</p>
          <h3>{{ t('guide.uninstallTitle') }}</h3>
        </div>
      </div>
      <p class="muted">{{ t('guide.uninstallDesc') }}</p>
      <button class="ghost-button danger-button" :disabled="!store.selectedRoot || store.busy" @click="uninstallModalOpen = true">
        {{ t('guide.uninstallPackage') }}
      </button>
    </section>

    <ActionModal
      :open="installConfirmOpen"
      :title="t('guide.installConfirmTitle')"
      :subtitle="t('guide.installConfirmSub')"
      :confirm-label="t('guide.installConfirm')"
      :loading="store.busy"
      @close="installConfirmOpen = false"
      @confirm="installPackage"
    >
      <label class="checkbox-row"><input v-model="confirmExited" type="checkbox" /> {{ t('guide.confirmExited') }}</label>
      <label class="checkbox-row"><input v-model="confirmRoot" type="checkbox" /> {{ t('guide.confirmRoot') }}</label>
    </ActionModal>

    <ActionModal
      :open="uninstallModalOpen"
      :title="t('guide.uninstallConfirmTitle')"
      :subtitle="t('guide.uninstallConfirmSub')"
      :confirm-label="t('guide.uninstallConfirm')"
      danger
      :loading="store.busy"
      @close="uninstallModalOpen = false"
      @confirm="uninstallBotPackage"
    >
      <p class="muted">{{ t('guide.uninstallDetail') }}</p>
    </ActionModal>
  </section>
</template>
