<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import ActionModal from '@/components/ActionModal.vue'
import CopyButton from '@/components/CopyButton.vue'
import StatusHero from '@/components/StatusHero.vue'
import SummaryStrip from '@/components/SummaryStrip.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import InlineNotice from '@/components/ui/InlineNotice.vue'
import { commandCenterTabs, teamPresets, type CommandTabKey } from '@/features/cs2/data'
import { getCommandsTxt } from '@/services/tauri/cs2'
import { useCustomCommandsStore } from '@/stores/custom-commands'
import { useUiPreferencesStore } from '@/stores/ui-preferences'
import type { CustomCommandItem } from '@/types/custom-command'

const COMMANDS_HINT_STORAGE_KEY = 'cs2-bot-improver.commands-page-hint-seen'

const route = useRoute()
const router = useRouter()
const customStore = useCustomCommandsStore()
const preferences = useUiPreferencesStore()

const copiedKey = ref('')
const commandsTxt = ref('')
const commandsTxtSource = ref('')
const commandsTxtError = ref('')
const commandsTxtLoading = ref(false)
const commandsTxtModalOpen = ref(false)
const searchQuery = ref('')
const activeTab = ref<CommandTabKey>('common')
const hintVisible = ref(window.localStorage.getItem(COMMANDS_HINT_STORAGE_KEY) !== 'true')
const commandsTxtTextarea = ref<HTMLTextAreaElement | null>(null)
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
  { label: 'Commands.txt', value: commandsTxt.value ? '已读取' : '待读取', state: commandsTxt.value ? 'ready' as const : 'warn' as const },
])

const heroBadges = computed(() => [
  {
    label: isCustomTab.value ? `已保存 ${customStore.items.length} 条自定义指令` : `${visibleCommands.value.length} 条可复制命令`,
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

const pinnedCommandItems = computed(() => preferences.pinnedCommands
  .map((command) => commandLookup.value.get(command) ?? { command, summary: '自定义固定命令' })
  .slice(0, 8))

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

function setActiveTab(tab: CommandTabKey) {
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

function togglePinnedCommand(command: string) {
  preferences.togglePinnedCommand(command)
}

function isPinned(command: string) {
  return preferences.pinnedCommands.includes(command)
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

async function loadCommandsTxt() {
  commandsTxtLoading.value = true
  commandsTxtError.value = ''
  try {
    const payload = await getCommandsTxt()
    commandsTxt.value = payload.content
    commandsTxtSource.value = payload.sourcePath
  } catch (error) {
    commandsTxt.value = ''
    commandsTxtSource.value = ''
    commandsTxtError.value = normalizeCommandsError(error)
  } finally {
    commandsTxtLoading.value = false
  }
}

async function copyCommandsTxtSelection() {
  const textarea = commandsTxtTextarea.value
  if (!textarea) {
    return
  }

  const selection = textarea.value.slice(textarea.selectionStart, textarea.selectionEnd).trim()
  const copied = await writeClipboardText(selection || textarea.value)
  if (!copied) {
    return
  }
  markCommandsFeatureUsed()
  markCopied('commands-txt-selection')
}

function normalizeCommandsError(error: unknown) {
  if (typeof error === 'string') {
    return error
  }
  if (error instanceof Error) {
    return error.message
  }
  return '读取 Commands.txt 失败。'
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
      activeTab.value = nextTab as CommandTabKey
    } else {
      activeTab.value = 'common'
    }
  },
  { immediate: true },
)

onMounted(async () => {
  preferences.load()
  await Promise.all([
    loadCommandsTxt(),
    customStore.initialize().then(() => {
      if (customStore.storagePath) {
        localMessage.value = `本地保存位置：${customStore.storagePath}`
      }
    }),
  ])
})

onBeforeUnmount(() => {
  if (copiedTimer) {
    clearTimeout(copiedTimer)
  }
})
</script>

<template>
  <section class="page-grid">
    <StatusHero
      eyebrow="指令中心"
      title="找到命令，复制即用"
      description="按场景筛选命令，复制后粘贴到 CS2 控制台或 Steam 启动项。"
      :badges="heroBadges"
    >
      <template #actions>
        <button class="ghost-button" :disabled="commandsTxtLoading" @click="commandsTxtModalOpen = true">
          查看完整 Commands.txt
        </button>
      </template>
    </StatusHero>

    <SummaryStrip :items="summaryItems" />

    <article class="card command-center-toolbar">
      <label class="field search-field">
        <span>搜索命令或说明</span>
        <input v-model="searchQuery" type="search" placeholder="例如 bot_nades、联机、启动项、AK" />
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

    <article v-if="pinnedCommandItems.length > 0 || preferences.recentCommands.length > 0" class="card pinned-command-panel">
      <div class="section-head">
        <div>
          <p class="eyebrow">固定和最近</p>
          <h3>老用户常用命令放这里。</h3>
        </div>
      </div>
      <div v-if="pinnedCommandItems.length > 0" class="pinned-command-strip">
        <button
          v-for="item in pinnedCommandItems"
          :key="`pinned:${item.command}`"
          class="pinned-command"
          type="button"
          @click="copy(item.command, `pinned:${item.command}`, item.copyWithoutSemicolon)"
        >
          <code>{{ item.command }}</code>
          <span>{{ item.summary }}</span>
        </button>
      </div>
      <div v-if="preferences.recentCommands.length > 0" class="recent-command-strip">
        <button
          v-for="item in preferences.recentCommands.slice(0, 4)"
          :key="`recent:${item.command}`"
          class="ghost-button"
          type="button"
          @click="copy(item.command, `recent:${item.command}`, commandLookup.get(item.command)?.copyWithoutSemicolon)"
        >
          {{ item.command }}
        </button>
      </div>
    </article>

    <article v-if="isTeamsTab" class="card command-center-panel">
      <div class="section-head">
        <div>
          <p class="eyebrow">职业队伍</p>
          <h3>复制到 CT 或 T 阵营。</h3>
        </div>
      </div>

      <div v-if="visibleTeams.length > 0" class="team-preset-grid">
        <article v-for="team in visibleTeams" :key="team.name" class="team-preset-card">
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

    <article v-else-if="!isCustomTab" class="card command-center-panel">
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
          class="command-card"
        >
          <button
            class="command-card__pin"
            type="button"
            :aria-label="isPinned(item.command) ? '取消固定命令' : '固定命令'"
            @click="togglePinnedCommand(item.command)"
          >
            {{ isPinned(item.command) ? '★' : '☆' }}
          </button>
          <code>{{ item.command }}</code>
          <span>{{ item.summary }}</span>
          <button class="command-card__copy" type="button" @click="copy(item.command, `${activeTab}:${item.command}`, item.copyWithoutSemicolon)">
            {{ copiedKey === `${activeTab}:${item.command}` ? '已复制' : '复制' }}
          </button>
        </article>
      </div>

      <EmptyState v-else title="没有匹配的命令" description="换一个关键词，或切换到其他分类看看。" state="warn" />
    </article>

    <article v-else class="custom-commands-layout command-center-custom">
      <section class="card custom-commands-list-card">
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
          <article v-for="item in visibleCustomCommands" :key="item.id" class="custom-command-card">
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

      <aside class="card custom-commands-editor-card">
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

    <ActionModal
      :open="commandsTxtModalOpen"
      title="完整 Commands.txt"
      subtitle="可以选中某一段后复制；如果没有选中内容，会复制全文。"
      cancel-label="关闭"
      hide-confirm
      @close="commandsTxtModalOpen = false"
      @confirm="commandsTxtModalOpen = false"
    >
      <div class="actions-row">
        <button class="ghost-button" :disabled="commandsTxtLoading" @click="loadCommandsTxt">
          {{ commandsTxtLoading ? '读取中' : '重新读取' }}
        </button>
        <button class="ghost-button" :disabled="!commandsTxt" @click="copyCommandsTxtSelection">
          {{ copiedKey === 'commands-txt-selection' ? '已复制' : '复制选中/全文' }}
        </button>
      </div>

      <label class="field">
        <span>完整内容</span>
        <textarea
          ref="commandsTxtTextarea"
          class="commands-txt-area"
          :value="commandsTxt"
          readonly
          spellcheck="false"
          placeholder="正在读取资源包里的 Commands.txt"
        />
      </label>

      <p v-if="commandsTxtSource" class="inline-path">
        来源：<code>{{ commandsTxtSource }}</code>
      </p>
      <p v-if="commandsTxtError" class="message-line">{{ commandsTxtError }}</p>
    </ActionModal>
  </section>
</template>
