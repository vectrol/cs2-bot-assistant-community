<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

import ActionModal from '@/components/ActionModal.vue'
import CollapsiblePanel from '@/components/CollapsiblePanel.vue'
import SummaryStrip from '@/components/SummaryStrip.vue'
import { commandGroups, weaponCommands } from '@/features/cs2/data'
import { getCommandsTxt } from '@/services/tauri/cs2'

const COMMANDS_HINT_STORAGE_KEY = 'cs2-bot-improver.commands-page-hint-seen'
const copiedKey = ref('')
const commandsTxt = ref('')
const commandsTxtSource = ref('')
const commandsTxtError = ref('')
const commandsTxtLoading = ref(false)
const commandsTxtModalOpen = ref(false)
const searchQuery = ref('')
const hintVisible = ref(window.localStorage.getItem(COMMANDS_HINT_STORAGE_KEY) !== 'true')
const commandsTxtTextarea = ref<HTMLTextAreaElement | null>(null)
let copiedTimer: ReturnType<typeof setTimeout> | null = null

const favoriteCommands = [
  { command: 'bot_kick', summary: '踢出当前全部 Bot。' },
  { command: 'mp_restartgame 1', summary: '保留当前设置并重开对局。' },
  { command: 'lbtv_difficulty', summary: '查看当前 Bot 难度档位。' },
  { command: '-insecure', summary: '把它加入 Steam 启动项。', copyWithoutSemicolon: true },
]

const summaryItems = computed(() => [
  { label: '命令分组', value: `${commandGroups.length} 组`, state: 'ready' as const },
  { label: '武器快捷项', value: `${weaponCommands.length} 个`, state: 'ready' as const },
  { label: 'Commands.txt', value: commandsTxt.value ? '已读取' : '待读取', state: commandsTxt.value ? 'ready' as const : 'warn' as const },
])

const visibleCommandGroups = computed(() => {
  const keyword = searchQuery.value.trim().toLowerCase()
  if (!keyword) {
    return commandGroups
  }

  return commandGroups
    .map((group) => ({
      ...group,
      commands: group.commands.filter((item) => (
        item.command.toLowerCase().includes(keyword)
        || item.summary.toLowerCase().includes(keyword)
        || group.title.toLowerCase().includes(keyword)
      )),
    }))
    .filter((group) => group.commands.length > 0)
})

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
    commandsTxtError.value = normalizeError(error)
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

function normalizeError(error: unknown) {
  if (typeof error === 'string') {
    return error
  }
  if (error instanceof Error) {
    return error.message
  }
  return '读取 Commands.txt 失败。'
}

onMounted(async () => {
  await loadCommandsTxt()
})

onBeforeUnmount(() => {
  if (copiedTimer) {
    clearTimeout(copiedTimer)
  }
})
</script>

<template>
  <section class="page-grid">
    <article class="hero-banner">
      <div>
        <p class="eyebrow">常用指令</p>
        <h2>复制命令后粘贴到 CS2 控制台使用。</h2>
      </div>
      <div class="hero-status">
        <button class="ghost-button" :disabled="commandsTxtLoading" @click="commandsTxtModalOpen = true">
          查看完整 Commands.txt
        </button>
      </div>
    </article>

    <SummaryStrip :items="summaryItems" />

    <article class="card">
      <div class="section-head">
        <div>
          <p class="eyebrow">快捷入口</p>
          <h3>常用命令</h3>
        </div>
      </div>
      <label class="field search-field">
        <span>搜索命令或说明</span>
        <input v-model="searchQuery" type="search" placeholder="例如 bot_nades、刀具、启动项" />
      </label>
      <p v-if="hintVisible" class="tip-box">点击任意指令即可复制，复制后粘贴到 CS2 控制台使用。</p>
      <div class="compact-command-grid">
        <button
          v-for="item in favoriteCommands"
          :key="item.command"
          class="weapon-chip"
          @click="copy(item.command, `favorite:${item.command}`, item.copyWithoutSemicolon)"
        >
          <code>{{ item.command }}</code>
          <span>{{ copiedKey === `favorite:${item.command}` ? '已复制' : item.summary }}</span>
        </button>
      </div>
    </article>

    <div class="content-grid">
      <CollapsiblePanel
        v-for="group in visibleCommandGroups"
        :key="group.title"
        :title="group.title"
        :subtitle="group.description"
        :badge="`${group.commands.length} 条`"
        :default-open="group.title === '常用控制'"
      >
        <div class="command-list">
          <button
            v-for="item in group.commands"
            :key="item.command"
            class="command-item command-item--copyable"
            type="button"
            @click="copy(item.command, `group:${group.title}:${item.command}`, item.copyWithoutSemicolon)"
          >
            <div class="command-item__body">
              <code>{{ item.command }}</code>
              <p class="muted">{{ item.summary }}</p>
            </div>
            <strong class="command-item__state">
              {{ copiedKey === `group:${group.title}:${item.command}` ? '已复制' : '点击复制' }}
            </strong>
          </button>
        </div>
      </CollapsiblePanel>

      <CollapsiblePanel title="Bot 武器" subtitle="复制后粘贴到控制台，下一回合开始 Bot 会优先使用这把武器。" :badge="`${weaponCommands.length} 个`">

        <div class="weapon-grid">
          <button
            v-for="item in weaponCommands"
            :key="item.command"
            class="weapon-chip"
            @click="copy(item.command, `weapon:${item.command}`)"
          >
            <code>{{ item.command }}</code>
            <span>{{ copiedKey === `weapon:${item.command}` ? '已复制' : item.label }}</span>
          </button>
        </div>

        <div class="tip-box">如果想恢复 Bot 默认买枪逻辑，可以输入 <code>bot_buy</code>。</div>
      </CollapsiblePanel>
    </div>

    <p v-if="visibleCommandGroups.length === 0" class="message-line">没有匹配的命令。</p>

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
