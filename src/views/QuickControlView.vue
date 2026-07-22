<script setup lang="ts">
import { computed, inject, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'

import ConsolePanel from '@/components/layout/ConsolePanel.vue'
import CopyButton from '@/components/CopyButton.vue'
import MetricTile from '@/components/ui/MetricTile.vue'
import InlineNotice from '@/components/ui/InlineNotice.vue'
import { appConfig } from '@/config/app'
import { teamPresets } from '@/features/cs2/data'
import { useCs2Store } from '@/stores/cs2'
import { useUiPreferencesStore } from '@/stores/ui-preferences'
import type { DifficultyPreset, GameModePreset } from '@/types/cs2'

const { t } = useI18n()
const store = useCs2Store()
const preferences = useUiPreferencesStore()

const openLaunchGameModal = inject<() => void>('openLaunchGameModal', () => {})

const teamQuery = ref('')
const localMessage = ref('')
const currentResourcePackageLabel = computed(() => `${t('quickControl.currentPackage')} ${appConfig.appVersion}`)
const currentCommandsTxtLabel = computed(() => `${appConfig.appVersion} Commands.txt`)

const modeOptions: Array<{ label: string; value: GameModePreset; detail: string }> = [
  { label: t('quickControl.modeBot'), value: 'withBots', detail: t('quickControl.modeBotDetail') },
  { label: t('quickControl.modeOnline'), value: 'online', detail: t('quickControl.modeOnlineDetail') },
]

const difficultyOptions: Array<{ label: string; value: DifficultyPreset; detail: string }> = [
  { label: t('quickControl.diffLow'), value: 'low', detail: t('quickControl.diffLowDetail') },
  { label: t('quickControl.diffMedium'), value: 'medium', detail: t('quickControl.diffMediumDetail') },
  { label: t('quickControl.diffHigh'), value: 'high', detail: t('quickControl.diffHighDetail') },
]

const aimPresets = [
  { label: t('quickControl.aimMixed'), value: 'mixed' as const, command: 'bot_aim mixed', detail: t('quickControl.aimMixedDetail') },
  { label: t('quickControl.aimHead'), value: 'head' as const, command: 'bot_aim head', detail: t('quickControl.aimHeadDetail') },
  { label: t('quickControl.aimBody'), value: 'body' as const, command: 'bot_aim body', detail: t('quickControl.aimBodyDetail') },
]

const nadePresets = [
  { label: t('quickControl.nadesNormal'), value: 'normal' as const, command: 'bot_nades normal', detail: t('quickControl.nadesNormalDetail') },
  { label: t('quickControl.nadesMore'), value: 'more' as const, command: 'bot_nades more', detail: t('quickControl.nadesMoreDetail') },
  { label: t('quickControl.nadesMax'), value: 'max' as const, command: 'bot_nades max', detail: t('quickControl.nadesMaxDetail') },
  { label: t('quickControl.nadesOff'), value: 'off' as const, command: 'bot_nades off', detail: t('quickControl.nadesOffDetail') },
]

const botItemNotes = computed(() => [
  { label: t('quickControl.botItemsSkin'), detail: t('quickControl.botItemsSkinDetail') },
  { label: t('quickControl.botItemsProfile'), detail: t('quickControl.botItemsProfileDetail') },
  { label: t('quickControl.botItemsAgent'), detail: t('quickControl.botItemsAgentDetail', { pkg: currentResourcePackageLabel.value }) },
  { label: t('quickControl.botItemsMusic'), detail: t('quickControl.botItemsMusicDetail') },
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
    label: t('quickControl.directory'),
    value: store.selectedRoot ? store.selectedRoot : t('quickControl.notSelected'),
    state: store.selectedRoot ? 'ready' as const : 'warn' as const,
  },
  {
    label: t('quickControl.installation'),
    value: store.readyForConfig ? t('quickControl.ready') : t('quickControl.checkPending'),
    state: store.readyForConfig ? 'ready' as const : 'warn' as const,
  },
  {
    label: t('quickControl.process'),
    value: store.cs2Running ? t('quickControl.running') : t('quickControl.notRunning'),
    state: store.cs2Running ? 'warn' as const : 'ready' as const,
  },
  {
    label: t('quickControl.teamPresets'),
    value: t('quickControl.teamCount', { n: teamPresets.length }),
    state: 'ready' as const,
  },
])

function recordCopied(label: string, command: string) {
  preferences.recordCommand(command, label)
  localMessage.value = t('quickControl.copiedLabel', { label })
}

function handleCopyFailed() {
  localMessage.value = t('copyButton.failed')
}

async function applyAim(value: 'head' | 'mixed' | 'body') {
  try {
    const result = await store.applyUpstreamAim(value)
    localMessage.value = result.message
  } catch (error) {
    localMessage.value = store.normalizeError(error)
  }
}

async function applyNades(value: 'max' | 'more' | 'normal' | 'off') {
  try {
    const result = await store.applyUpstreamNades(value)
    localMessage.value = result.message
  } catch (error) {
    localMessage.value = store.normalizeError(error)
  }
}

async function refreshStatus() {
  try {
    await Promise.all([
      store.refreshCs2Running(),
      store.refreshEnvironment(),
    ])
    localMessage.value = t('quickControl.statusRefreshed')
  } catch (error) {
    localMessage.value = store.normalizeError(error)
  }
}

async function runOneClickFlow() {
  try {
    await refreshStatus()
    if (!store.selectedRoot) {
      localMessage.value = t('quickControl.noRootGuide')
      return
    }
    if (!store.readyForConfig) {
      localMessage.value = t('quickControl.envNotReady')
      return
    }
    if (store.cs2Running) {
      localMessage.value = t('quickControl.cs2RunningMsg')
      return
    }
    localMessage.value = t('quickControl.checkPassed')
  } catch (error) {
    localMessage.value = store.normalizeError(error)
  }
}

async function switchMode(value: GameModePreset) {
  try {
    const result = await store.switchGameMode(value)
    localMessage.value = result.message
    await refreshStatus()
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

async function openLaunchModal() {
  openLaunchGameModal()
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
        :eyebrow="t('quickControl.title')"
        :title="t('quickControl.title')"
        :description="t('quickControl.description', { txt: currentCommandsTxtLabel })"
        tone="strong"
      >
        <template #actions>
          <button class="primary-button" type="button" @click="openLaunchModal">{{ t('quickControl.launchCs2') }}</button>
          <button class="ghost-button" type="button" :disabled="store.busy" @click="runOneClickFlow">{{ t('quickControl.oneClickCheck') }}</button>
          <button class="ghost-button" type="button" :disabled="store.busy" @click="refreshStatus">{{ t('quickControl.refresh') }}</button>
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
      :message="t('quickControl.noRootMsg')"
      state="warn"
    />

    <div class="quick-control-grid">
      <article class="card quick-card command-panel">
        <div class="section-head">
          <div>
            <p class="eyebrow">{{ t('quickControl.gameMode') }}</p>
            <h3>{{ t('quickControl.modeSection') }}</h3>
          </div>
          <RouterLink class="ghost-button" to="/guide">
            {{ t('quickControl.help') }}
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
            <p class="eyebrow">{{ t('quickControl.difficulty') }}</p>
            <h3>{{ t('quickControl.diffSection') }}</h3>
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
            <p class="eyebrow">{{ t('quickControl.aimPreset') }}</p>
            <h3>{{ t('quickControl.aimPresets') }}</h3>
          </div>
        </div>
        <div class="preset-section">
          <p class="muted">{{ t('quickControl.aimPreset') }}</p>
          <div class="quick-chip-grid">
            <button
              v-for="preset in aimPresets"
              :key="preset.command"
              class="quick-option"
              type="button"
              :disabled="!store.selectedRoot || store.busy"
              @click="applyAim(preset.value)"
            >
              {{ preset.label }}
            </button>
          </div>
        </div>
        <div class="preset-section">
          <p class="muted">{{ t('quickControl.nadesPreset') }}</p>
          <div class="quick-chip-grid">
            <button
              v-for="preset in nadePresets"
              :key="preset.command"
              class="quick-option"
              type="button"
              :disabled="!store.selectedRoot || store.busy"
              @click="applyNades(preset.value)"
            >
              {{ preset.label }}
            </button>
          </div>
        </div>
      </article>

      <article class="card quick-card">
        <div class="section-head">
          <div>
            <p class="eyebrow">{{ t('quickControl.botItems') }}</p>
            <h3>{{ t('quickControl.botItemsTitle') }}</h3>
          </div>
          <RouterLink class="ghost-button" to="/guide">
            {{ t('quickControl.manual') }}
          </RouterLink>
        </div>
        <div class="bot-item-grid">
          <div v-for="item in botItemNotes" :key="item.label" class="bot-item-note">
            <strong>{{ item.label }}</strong>
            <span>{{ item.detail }}</span>
          </div>
        </div>
        <p class="tip-box">
          {{ t('quickControl.botItemsTip') }}
        </p>
      </article>

      <article class="card quick-card quick-card--wide">
        <div class="section-head">
          <div>
            <p class="eyebrow">{{ t('quickControl.teamPresets') }}</p>
            <h3>{{ t('quickControl.teamsSection') }}</h3>
          </div>
          <RouterLink class="ghost-button" to="/commands?tab=teams">
            {{ t('quickControl.goToCommands') }}
          </RouterLink>
        </div>

        <label class="field search-field">
          <span>{{ t('quickControl.teamsSearch') }}</span>
          <input v-model="teamQuery" type="search" :placeholder="t('quickControl.teamsSearchPlaceholder')" />
        </label>

        <div class="team-preset-grid">
          <article v-for="team in visibleTeams" :key="team.name" class="team-preset-card">
            <strong>{{ team.name }}</strong>
            <div class="actions-row">
              <CopyButton
                :text="team.ct"
                :label="t('quickControl.copyCt')"
                :copy-without-semicolon="true"
                @copied="recordCopied(`${team.name} CT`, team.ct)"
                @failed="handleCopyFailed"
              />
              <CopyButton
                :text="team.t"
                :label="t('quickControl.copyT')"
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
      :state="localMessage.includes(t('copyButton.failed').replace(t('copyButton.failed'), '')) || localMessage.includes(t('quickControl.noRootGuide')) ? 'warn' : 'info'"
    />
  </section>
</template>
