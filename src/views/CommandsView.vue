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

const COMMANDS_HINT_STORAGE_KEY = 'cs2-bot-improver.commands-page-hint-seen'
type CommandPageTabKey = CommandTabKey

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
  ...commandCenterTabs.map((tab) => ({
    key: tab.key,
    label: tab.label,
    count: tab.commands.length,
  })),
  {
    key: 'custom' as const,
    label: '自定义',
    count: customStore.items.length,
  },
])

const currentCommandTab = computed(() => commandCenterTabs.find((tab) => tab.key === activeTab.value) ?? commandCenterTabs[0])
const isCustomTab = computed(() => activeTab.value === 'custom')
const isTeamsTab = computed(() => activeTab.value === 'teams')
const isEditing = computed(() => editingId.value.length > 0)
const hasCustomItems = computed(() => customStore.items.length > 0)

const visibleCommands = computed(() => {
  const tab = currentCommandTab.value
  const keyword = searchQuery.value.trim().toLowerCase()
  const commands = tab?.commands ?? []
  if (!keyword) {
    return commands
  }
  return commands.filter((item) => (
    item.command.toLowerCase().includes(keyword)
    || item.summary.toLowerCase().includes(keyword)
    || tab?.label.toLowerCase().includes(keyword)
  ))
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
  { label: '分类', value: `${tabs.value.length} 个`, state: 'ready' as const },
  {
    label: '当前结果',
    value: isCustomTab.value
      ? `${visibleCustomCommands.value.length} 条`
      : isTeamsTab.value
        ? `${visibleTeams.value.length} 支`
        : `${visibleCommands.value.length} 条`,
    state: 'ready' as const,
  },
])

const commandLookup = computed(() => {
  const map = new Map<string, { command: string; summary: string; copyWithoutSemicolon?: boolean }>()
  for (const tab of commandCenterTabs) {
    for (const item of tab.commands) {
      map.set(item.command, item)
    }
  }
  return map
})

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
  router.replace({ path: '/commands', query: tab === 'common' ? {} : { tab } })
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
  localMessage.value = '复制失败，请手动选中命令后复制。'
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
  preferences.recordCommand(trimmed, '从指令中心复制')
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
    localMessage.value = customStore.storagePath ? `已保存到本地：${customStore.storagePath}` : '已保存到本地。'
    resetForm()
  } catch (error) {
    localMessage.value = normalizeCustomError(error)
  }
}

async function deleteCommand(id: string) {
  try {
    await customStore.deleteCommand(id)
    localMessage.value = customStore.storagePath ? `已从本地文件删除：${customStore.storagePath}` : '已删除。'
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
  return '保存本地指令失败，请稍后重试。'
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
      localMessage.value = `本地保存位置：${customStore.storagePath}`
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
      eyebrow="Command Library"
      title="指令库"
      description="按场景筛选命令，复制后粘贴到 CS2 控制台或 Steam 启动项。"
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
        <span>搜索命令或说明</span>
        <input v-model="searchQuery" type="search" placeholder="例如 bot_kick、sv_cheats、cl_crosshair、启动项" />
      </label>

      <div class="command-tabs" role="tablist" aria-label="指令分类">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          class="command-tab"
          type="button"
          :data-active="activeTab === tab.key"
          @click="setActiveTab(tab.key)"
        >
          <span>{{ tab.label }}</span>
          <small>{{ tab.count }}</small>
        </button>
      </div>
    </article>

    <p v-if="hintVisible" class="tip-box">点击任意命令卡即可复制。</p>

    <article v-if="isTeamsTab" class="card command-center-panel glass">
      <div class="section-head">
        <div>
          <p class="eyebrow">职业队伍</p>
          <h3>复制到 CT 或 T 阵营。</h3>
        </div>
      </div>

      <div v-if="visibleTeams.length > 0" class="team-preset-grid">
        <article v-for="team in visibleTeams" :key="team.name" class="team-preset-card glass">
          <strong>{{ team.name }}</strong>
          <div class="actions-row">
            <CopyButton
              :text="team.ct"
              label="复制 CT"
              :copy-without-semicolon="true"
              @copied="recordCommandUse(team.ct, `${team.name} CT`)"
              @failed="handleCopyFailed"
            />
            <CopyButton
              :text="team.t"
              label="复制 T"
              :copy-without-semicolon="true"
              @copied="recordCommandUse(team.t, `${team.name} T`)"
              @failed="handleCopyFailed"
            />
          </div>
        </article>
      </div>

      <EmptyState v-else title="没有匹配的队伍" description="换一个队伍名或队员名继续搜索。" state="warn" />
    </article>

    <article v-else-if="!isCustomTab" class="card command-center-panel glass">
      <div class="section-head">
        <div>
          <p class="eyebrow">{{ currentCommandTab?.label }}</p>
          <h3>{{ currentCommandTab?.description }}</h3>
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
          <span>{{ item.summary }}</span>
          <button class="command-card__copy" type="button" @click.stop="copy(item.command, `${activeTab}:${item.command}`, item.copyWithoutSemicolon)">
            {{ copiedKey === `${activeTab}:${item.command}` ? '已复制' : '复制' }}
          </button>
        </article>
      </div>

      <EmptyState v-else title="没有匹配的命令" description="换一个关键词，或切换到其他分类看看。" state="warn" />
    </article>

    <article v-else class="custom-commands-layout command-center-custom">
      <section class="card custom-commands-list-card glass">
        <div class="section-head">
          <div>
            <p class="eyebrow">自定义</p>
            <h3>{{ hasCustomItems ? '你的常用列表' : '列表还是空的' }}</h3>
          </div>
        </div>

        <EmptyState
          v-if="!hasCustomItems"
          title="还没有保存的命令"
          description="在右侧保存一条，之后就能在指令中心直接复制。"
          state="info"
        />

        <div v-else-if="visibleCustomCommands.length > 0" class="command-card-grid">
          <article v-for="item in visibleCustomCommands" :key="item.id" class="custom-command-card glass">
            <div class="custom-command-head">
              <div>
                <strong>{{ item.title || '未命名命令' }}</strong>
                <p v-if="item.description" class="muted">{{ item.description }}</p>
              </div>
              <div class="actions-row">
                <CopyButton
                  :text="item.command"
                  :copy-without-semicolon="false"
                  @copied="recordCommandUse(item.command, item.description || item.title || '自定义命令')"
                  @failed="handleCopyFailed"
                />
                <button class="ghost-button" @click="editCommand(item)">编辑</button>
                <button class="ghost-button danger-button" :disabled="customStore.busy" @click="deleteCommand(item.id)">
                  删除
                </button>
              </div>
            </div>

            <pre class="command-preview"><code>{{ item.command }}</code></pre>
          </article>
        </div>

        <EmptyState v-else title="没有匹配的自定义指令" description="可以清空搜索词，或保存一条新的常用命令。" state="warn" />
      </section>

      <aside class="card custom-commands-editor-card glass">
        <div class="section-head">
          <div>
            <p class="eyebrow">{{ isEditing ? '编辑命令' : '新建命令' }}</p>
            <h3>{{ isEditing ? '修改这条命令' : '保存一条新的常用命令' }}</h3>
          </div>
          <button
            v-if="isEditing || form.title || form.description || form.command"
            class="ghost-button"
            @click="resetForm"
          >
            清空
          </button>
        </div>

        <div class="form-grid compact-form-grid">
          <label class="field">
            <span>名称</span>
            <input v-model="form.title" type="text" placeholder="可留空，例如：热身 Bot" />
          </label>

          <label class="field">
            <span>备注</span>
            <textarea v-model="form.description" rows="2" placeholder="可留空，例如：训练前快速重开对局" />
          </label>

          <label class="field">
            <span>命令内容</span>
            <textarea v-model="form.command" rows="8" placeholder="必填，例如：bot_kick; bot_add_ct; mp_restartgame 1" />
          </label>

          <button class="primary-button wide" :disabled="!form.command.trim() || customStore.busy" @click="submitCustomCommand">
            {{ isEditing ? '保存修改' : '保存命令' }}
          </button>
        </div>
      </aside>
    </article>

    <InlineNotice v-if="localMessage && isCustomTab" :message="localMessage" :state="localMessage.includes('失败') ? 'danger' : 'info'" />

  </section>
</template>
