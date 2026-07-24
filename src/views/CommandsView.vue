<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import ConsolePanel from '@/components/layout/ConsolePanel.vue'
import CopyButton from '@/components/CopyButton.vue'
import MetricTile from '@/components/ui/MetricTile.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import InlineNotice from '@/components/ui/InlineNotice.vue'
import { commandCenterTabs, teamPresets, type CommandTabKey } from '@/features/cs2/data'
import { useCustomCommandsStore } from '@/stores/custom-commands'
import { useUiPreferencesStore } from '@/stores/ui-preferences'
import type { CustomCommandItem } from '@/types/custom-command'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const COMMANDS_HINT_STORAGE_KEY = 'cs2-bot-improver.commands-page-hint-seen'
type CommandPageTabKey = CommandTabKey | 'pinned'

const route = useRoute()
const router = useRouter()
const customStore = useCustomCommandsStore()
const preferences = useUiPreferencesStore()

const copiedKey = ref('')
const searchQuery = ref('')
const activeTab = ref<CommandPageTabKey>('common')
const hintVisible = ref(window.localStorage.getItem(COMMANDS_HINT_STORAGE_KEY) !== 'true')
const editingId = ref('')
const localMessage = ref('')
const form = reactive({
  title: '',
  description: '',
  command: '',
})

let copiedTimer: ReturnType<typeof setTimeout> | null = null

const tabs = computed(() => [
  ...(preferences.pinnedCommands.length > 0 ? [{
    key: 'pinned' as const,
    label: t('commands.pinned'),
    count: preferences.pinnedCommands.length,
  }] : []),
  ...commandCenterTabs.map((tab) => ({
    key: tab.key,
    label: t(`commands.tabs.${tab.key}` as `commands.tabs.${typeof tab.key}`),
    count: tab.commands.length,
  })),
  {
    key: 'custom' as const,
    label: t('commands.customTab'),
    count: customStore.items.length,
  },
])

const currentCommandTab = computed(() => commandCenterTabs.find((tab) => tab.key === activeTab.value) ?? commandCenterTabs[0])
const pinnedItems = computed(() => preferences.pinnedCommands)
const currentTabLabel = computed(() => activeTab.value && !isCustomTab.value && !isTeamsTab.value ? t(`commands.tabs.${activeTab.value}` as const) : '')
const currentTabDesc = computed(() => activeTab.value && !isCustomTab.value && !isTeamsTab.value ? t(`commands.tabs.${activeTab.value}.desc` as const) : '')
const isCustomTab = computed(() => activeTab.value === 'custom')
const isTeamsTab = computed(() => activeTab.value === 'teams')
const isPinnedTab = computed(() => activeTab.value === 'pinned')
const isEditing = computed(() => editingId.value.length > 0)
const hasCustomItems = computed(() => customStore.items.length > 0)

const visibleCommands = computed(() => {
  const tab = currentCommandTab.value
  const keyword = searchQuery.value.trim().toLowerCase()
  const commands = tab?.commands ?? []
  if (!keyword) {
    return commands
  }
  return commands.filter((item) => {
    if (item.command.toLowerCase().includes(keyword)) return true
    if (item.summary.toLowerCase().includes(keyword)) return true
    if (item.summaryKey && t(item.summaryKey).toLowerCase().includes(keyword)) return true
    if (tab?.label.toLowerCase().includes(keyword)) return true
    return false
  })
})

const visibleCustomCommands = computed(() => {
  const keyword = searchQuery.value.trim().toLowerCase()
  if (!keyword) {
    return customStore.items
  }
  return customStore.items.filter((item) => (
    item.command.toLowerCase().includes(keyword)
    || item.title.toLowerCase().includes(keyword)
    || item.description.toLowerCase().includes(keyword)
  ))
})

const visibleTeams = computed(() => {
  const keyword = searchQuery.value.trim().toLowerCase()
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
  { label: t('commands.categoryCount'), value: t('commands.categoryCountValue', { n: tabs.value.length }), state: 'ready' as const },
  {
    label: isCustomTab.value
      ? t('commands.resultCount', { n: visibleCustomCommands.value.length })
      : isTeamsTab.value
        ? t('commands.teamsCount', { n: visibleTeams.value.length })
        : t('commands.resultCount', { n: visibleCommands.value.length }),
    value: isCustomTab.value
      ? `${visibleCustomCommands.value.length}`
      : isTeamsTab.value
        ? `${visibleTeams.value.length}`
        : `${visibleCommands.value.length}`,
    state: 'ready' as const,
  },
])

function resetForm() {
  editingId.value = ''
  form.title = ''
  form.description = ''
  form.command = ''
}

function editCommand(item: CustomCommandItem) {
  activeTab.value = 'custom'
  editingId.value = item.id
  form.title = item.title
  form.description = item.description
  form.command = item.command
}

function setActiveTab(tab: CommandPageTabKey) {
  activeTab.value = tab
  if (tab === 'pinned' || tab === 'custom') {
    router.replace({ path: '/commands', query: { tab } })
  } else {
    router.replace({ path: '/commands', query: tab === 'common' ? {} : { tab } })
  }
}

function markCopied(key: string) {
  copiedKey.value = key
  if (copiedTimer) {
    clearTimeout(copiedTimer)
  }
  copiedTimer = setTimeout(() => {
    copiedKey.value = ''
    copiedTimer = null
  }, 1000)
}

function handleCopyFailed() {
  localMessage.value = t('copyButton.failed')
}

function recordCommandUse(command: string, summary: string) {
  preferences.recordCommand(command, summary)
  markCommandsFeatureUsed()
}

function markCommandsFeatureUsed() {
  hintVisible.value = false
  window.localStorage.setItem(COMMANDS_HINT_STORAGE_KEY, 'true')
}

async function writeClipboardText(text: string) {
  try {
    await navigator.clipboard?.writeText(text)
    return true
  } catch {
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.setAttribute('readonly', 'true')
    textarea.style.position = 'fixed'
    textarea.style.top = '-9999px'
    document.body.appendChild(textarea)
    textarea.select()
    try {
      return document.execCommand('copy')
    } finally {
      document.body.removeChild(textarea)
    }
  }
}

async function copy(text: string, key: string, copyWithoutSemicolon = false) {
  const trimmed = text.trim()
  const normalized = copyWithoutSemicolon || trimmed.endsWith(';') ? trimmed : `${trimmed};`
  const copied = await writeClipboardText(normalized)
  if (!copied) {
    return
  }
  markCommandsFeatureUsed()
  markCopied(key)
  preferences.recordCommand(trimmed, t('commands.title'))
}

async function submitCustomCommand() {
  const trimmedCommand = form.command.trim()
  if (!trimmedCommand) {
    return
  }

  const draft = {
    title: form.title,
    description: form.description,
    command: trimmedCommand,
  }

  try {
    if (editingId.value) {
      await customStore.updateCommand(editingId.value, draft)
    } else {
      await customStore.addCommand(draft)
    }
    localMessage.value = customStore.storagePath ? t('commands.savedToLocal', { path: customStore.storagePath }) : t('commands.savedLocal')
    resetForm()
  } catch (error) {
    localMessage.value = normalizeCustomError(error)
  }
}

async function deleteCommand(id: string) {
  try {
    await customStore.deleteCommand(id)
    localMessage.value = customStore.storagePath ? t('commands.deletedFromLocal', { path: customStore.storagePath }) : t('commands.deletedLocal')
  } catch (error) {
    localMessage.value = normalizeCustomError(error)
  }
}

function normalizeCustomError(error: unknown) {
  if (typeof error === 'string') {
    return error
  }
  if (error instanceof Error) {
    return error.message
  }
  return t('commands.saveFailed')
}

function exportCommands() {
  if (customStore.items.length === 0) return
  const blob = new Blob([JSON.stringify(customStore.items, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `cs2-custom-commands-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
  localMessage.value = t('commands.exportSuccess', { n: customStore.items.length })
}

async function importCommands() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'
  input.onchange = async () => {
    const file = input.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      if (!Array.isArray(data)) throw new Error('Invalid format')
      const valid = data.filter((item: unknown) =>
        typeof item === 'object' && item && typeof Reflect.get(item, 'command') === 'string'
      )
      if (valid.length === 0) throw new Error('No valid commands found')
      for (const item of valid) {
        await customStore.addCommand({
          title: String(Reflect.get(item, 'title') || ''),
          description: String(Reflect.get(item, 'description') || ''),
          command: String(Reflect.get(item, 'command')),
        })
      }
      localMessage.value = t('commands.importSuccess', { n: valid.length })
    } catch {
      localMessage.value = t('commands.importFailed')
    }
  }
  input.click()
}

function togglePinned(command: string) {
  preferences.togglePinnedCommand(command)
}

function isPinned(command: string): boolean {
  return preferences.pinnedCommands.includes(command)
}

watch(
  () => route.query.tab,
  (tab) => {
    const nextTab = typeof tab === 'string' ? tab : ''
    if (tabs.value.some((item) => item.key === nextTab)) {
      activeTab.value = nextTab as CommandPageTabKey
    } else {
      activeTab.value = 'common'
    }
  },
  { immediate: true },
)

onMounted(async () => {
  preferences.load()
  await customStore.initialize().then(() => {
    if (customStore.storagePath) {
      localMessage.value = t('commands.storagePath', { path: customStore.storagePath })
    }
  })
})

onBeforeUnmount(() => {
  if (copiedTimer) {
    clearTimeout(copiedTimer)
  }
})
</script>

<template>
  <section class="page-grid commands-console-page">
    <ConsolePanel
      :eyebrow="t('commands.title')"
      :title="t('commands.title')"
      :description="t('commands.description')"
      tone="strong"
      class="glass"
    >
      <template #actions>
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

    <article class="card command-center-toolbar glass">
      <label class="field search-field">
        <span>{{ t('commands.search') }}</span>
        <input v-model="searchQuery" type="search" :placeholder="t('commands.searchPlaceholder')" />
      </label>

      <div class="command-tabs" role="tablist" :aria-label="t('commands.title')">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          class="command-tab"
          type="button"
          role="tab"
          :aria-selected="activeTab === tab.key"
          :data-active="activeTab === tab.key"
          @click="setActiveTab(tab.key)"
        >
          <span>{{ tab.label }}</span>
          <small>{{ tab.count }}</small>
        </button>
      </div>
    </article>

    <p v-if="hintVisible" class="tip-box">{{ t('commands.copyHint') }}</p>

    <article v-if="isTeamsTab" class="card command-center-panel glass">
      <div class="section-head">
        <div>
          <p class="eyebrow">{{ t('commands.teamPresetsTitle') }}</p>
          <h3>{{ t('commands.teamPresetsDesc') }}</h3>
        </div>
      </div>

      <div v-if="visibleTeams.length > 0" class="team-preset-grid">
        <article v-for="team in visibleTeams" :key="team.name" class="team-preset-card glass">
          <strong>{{ team.name }}</strong>
          <div class="actions-row">
            <CopyButton
              :text="team.ct"
              :label="t('quickControl.copyCt')"
              :copy-without-semicolon="true"
              @copied="recordCommandUse(team.ct, `${team.name} CT`)"
              @failed="handleCopyFailed"
            />
            <CopyButton
              :text="team.t"
              :label="t('quickControl.copyT')"
              :copy-without-semicolon="true"
              @copied="recordCommandUse(team.t, `${team.name} T`)"
              @failed="handleCopyFailed"
            />
          </div>
        </article>
      </div>

      <EmptyState v-else :title="t('commands.noTeams')" :description="t('commands.noTeamsDesc')" state="warn" />
    </article>

    <article v-else-if="isPinnedTab" class="card command-center-panel glass">
      <div class="section-head">
        <div>
          <p class="eyebrow">{{ t('commands.pinned') }}</p>
          <h3>{{ t('commands.pinnedDesc') }}</h3>
        </div>
      </div>

      <div v-if="pinnedItems.length > 0" class="command-card-grid">
        <article v-for="cmd in pinnedItems" :key="cmd" class="command-card glass" @click="copy(cmd, `pinned:${cmd}`)">
          <code>{{ cmd }}</code>
          <span>{{ t('commands.pinnedItem') }}</span>
          <button class="command-card__copy" type="button" @click.stop="togglePinned(cmd)">
            {{ t('commands.unpin') }}
          </button>
        </article>
      </div>

      <EmptyState v-else :title="t('commands.noPinned')" description="" state="info" />
    </article>

    <article v-else-if="!isCustomTab" class="card command-center-panel glass">
      <div class="section-head">
        <div>
          <p class="eyebrow">{{ currentTabLabel }}</p>
          <h3>{{ currentTabDesc }}</h3>
        </div>
      </div>

      <div v-if="visibleCommands.length > 0" class="command-card-grid">
        <article
          v-for="item in visibleCommands"
          :key="`${activeTab}:${item.command}`"
          class="command-card glass"
          @click="copy(item.command, `${activeTab}:${item.command}`, item.copyWithoutSemicolon)"
        >
          <code>{{ item.command }}</code>
          <span>{{ item.summaryKey ? t(item.summaryKey) : item.summary }}</span>
          <button class="command-card__copy" type="button" @click.stop="copy(item.command, `${activeTab}:${item.command}`, item.copyWithoutSemicolon)">
            {{ copiedKey === `${activeTab}:${item.command}` ? t('commands.copied') : t('commands.copy') }}
          </button>
          <button class="command-card__pin" type="button" :title="isPinned(item.command) ? t('commands.unpin') : t('commands.pin')" @click.stop="togglePinned(item.command)">
            {{ isPinned(item.command) ? '★' : '☆' }}
          </button>
        </article>
      </div>

      <EmptyState v-else :title="t('commands.noCommands')" :description="t('commands.noCommandsDesc')" state="warn" />
    </article>

    <article v-else class="custom-commands-layout command-center-custom">
      <section class="card custom-commands-list-card glass">
        <div class="section-head">
          <div>
            <p class="eyebrow">{{ t('commands.customTab') }}</p>
            <h3>{{ hasCustomItems ? t('commands.customTabTitle') : t('commands.customTabEmpty') }}</h3>
          </div>
          <div class="actions-row">
            <button class="ghost-button" :disabled="customStore.items.length === 0" @click="exportCommands">
              {{ t('commands.export') }}
            </button>
            <button class="ghost-button" @click="importCommands">
              {{ t('commands.import') }}
            </button>
          </div>
        </div>

        <EmptyState
          v-if="!hasCustomItems"
          :title="t('commands.customEmptyTitle')"
          :description="t('commands.customEmptyDesc')"
          state="info"
        />

        <div v-else-if="visibleCustomCommands.length > 0" class="command-card-grid">
          <article v-for="item in visibleCustomCommands" :key="item.id" class="custom-command-card glass">
            <div class="custom-command-head">
              <div>
                <strong>{{ item.title || t('commands.noName') }}</strong>
                <p v-if="item.description" class="muted">{{ item.description }}</p>
              </div>
              <div class="actions-row">
                <CopyButton
                  :text="item.command"
                  :copy-without-semicolon="false"
                  @copied="recordCommandUse(item.command, item.description || item.title || t('commands.customTab'))"
                  @failed="handleCopyFailed"
                />
                <button class="ghost-button" @click="editCommand(item)">{{ t('app.edit') }}</button>
                <button class="ghost-button danger-button" :disabled="customStore.busy" @click="deleteCommand(item.id)">
                  {{ t('app.delete') }}
                </button>
              </div>
            </div>

            <pre class="command-preview"><code>{{ item.command }}</code></pre>
          </article>
        </div>

        <EmptyState v-else :title="t('commands.noCommands')" :description="t('commands.noCommandsDesc')" state="warn" />
      </section>

      <aside class="card custom-commands-editor-card glass">
        <div class="section-head">
          <div>
            <p class="eyebrow">{{ isEditing ? t('commands.editCommand') : t('commands.newCommand') }}</p>
            <h3>{{ isEditing ? t('commands.editCommandDesc') : t('commands.newCommandDesc') }}</h3>
          </div>
          <button
            v-if="isEditing || form.title || form.description || form.command"
            class="ghost-button"
            @click="resetForm"
          >
            {{ t('app.clear') }}
          </button>
        </div>

        <div class="form-grid compact-form-grid">
          <label class="field">
            <span>{{ t('commands.commandName') }}</span>
            <input v-model="form.title" type="text" :placeholder="t('commands.commandNamePlaceholder')" />
          </label>

          <label class="field">
            <span>{{ t('commands.commandNote') }}</span>
            <textarea v-model="form.description" rows="2" :placeholder="t('commands.commandNotePlaceholder')" />
          </label>

          <label class="field">
            <span>{{ t('commands.commandContent') }}</span>
            <textarea v-model="form.command" rows="8" :placeholder="t('commands.commandContentPlaceholder')" />
          </label>

          <button class="primary-button wide" :disabled="!form.command.trim() || customStore.busy" @click="submitCustomCommand">
            {{ isEditing ? t('commands.saveEdit') : t('commands.saveCommand') }}
          </button>
        </div>
      </aside>
    </article>

    <InlineNotice v-if="localMessage && isCustomTab" :message="localMessage" :state="localMessage.includes(t('copyButton.failed')) ? 'danger' : 'info'" />

  </section>
</template>
