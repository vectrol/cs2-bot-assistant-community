<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'

import ActionModal from '@/components/ActionModal.vue'
import CollapsiblePanel from '@/components/CollapsiblePanel.vue'
import SummaryStrip from '@/components/SummaryStrip.vue'
import { guideSections } from '@/features/cs2/data'
import { openExternalUrl } from '@/services/tauri/app'
import { useCs2Store } from '@/stores/cs2'

const store = useCs2Store()
const statusCopied = ref(false)
const groupCopied = ref(false)
const groupMessage = ref('')
const uninstallModalOpen = ref(false)
const groupUrl = 'https://qm.qq.com/q/QRlMlc1h2E'
let copiedTimer: ReturnType<typeof setTimeout> | null = null
let groupCopiedTimer: ReturnType<typeof setTimeout> | null = null

const summaryItems = computed(() => [
  { label: '交流群', value: '可打开或复制', state: 'ready' as const },
  { label: '当前目录', value: store.selectedRoot || '未选择', state: store.selectedRoot ? 'ready' as const : 'warn' as const },
  { label: '帮助条目', value: `${guideSections.length} 条`, state: 'ready' as const },
])

function copy(text: string) {
  const normalized = text.trim().endsWith(';') ? text.trim() : `${text.trim()};`
  navigator.clipboard.writeText(normalized)
  statusCopied.value = true
  if (copiedTimer) {
    clearTimeout(copiedTimer)
  }
  copiedTimer = setTimeout(() => {
    statusCopied.value = false
    copiedTimer = null
  }, 1000)
}

function copyGroupUrl() {
  navigator.clipboard.writeText(groupUrl)
  groupCopied.value = true
  if (groupCopiedTimer) {
    clearTimeout(groupCopiedTimer)
  }
  groupCopiedTimer = setTimeout(() => {
    groupCopied.value = false
    groupCopiedTimer = null
  }, 1000)
}

async function openGroupUrl() {
  try {
    await openExternalUrl(groupUrl)
    groupMessage.value = ''
  } catch (error) {
    groupMessage.value = typeof error === 'string' ? error : '打开交流群链接失败，请手动复制后访问。'
  }
}

async function uninstallBotPackage() {
  try {
    await store.uninstall()
    uninstallModalOpen.value = false
  } catch (error) {
    store.setMessage(store.normalizeError(error))
  }
}

onBeforeUnmount(() => {
  if (copiedTimer) {
    clearTimeout(copiedTimer)
  }
  if (groupCopiedTimer) {
    clearTimeout(groupCopiedTimer)
  }
})
</script>

<template>
  <section class="page-grid">
    <article class="hero-banner">
      <div>
        <p class="eyebrow">使用帮助</p>
        <h2>安装 CS2 Bot 包后常用的补充操作。</h2>
      </div>
      <div class="hero-status">
        <button class="ghost-button" @click="openGroupUrl">打开交流群</button>
        <button class="ghost-button" @click="copyGroupUrl">
          {{ groupCopied ? '已复制' : '复制群链接' }}
        </button>
      </div>
    </article>

    <SummaryStrip :items="summaryItems" />

    <div class="content-grid two-column">
      <article class="card">
        <p class="eyebrow">和朋友一起玩</p>
        <h3>复制并分享连接命令</h3>
        <p class="muted">
          在 CS2 控制台输入 <code>status</code>，找到 <code>steamid</code> 那一行，把后面的地址加上 <code>connect </code> 后发给朋友。
        </p>
        <button class="ghost-button" @click="copy('status')">
          {{ statusCopied ? '已复制' : '复制 status' }}
        </button>
      </article>

      <article class="card">
        <p class="eyebrow">交流反馈</p>
        <h3>加入反馈群</h3>
        <p class="muted">使用问题、资源包反馈和后续更新都可以在这里交流。</p>
        <div class="actions-row">
          <button class="ghost-button" @click="openGroupUrl">打开群链接</button>
          <button class="ghost-button" @click="copyGroupUrl">
            {{ groupCopied ? '已复制' : '复制链接' }}
          </button>
        </div>
        <p v-if="groupMessage" class="message-line">{{ groupMessage }}</p>
      </article>
    </div>

    <div class="content-grid">
      <CollapsiblePanel
        v-for="section in guideSections"
        :key="section.title"
        :title="section.title"
        subtitle="帮助说明"
        badge="帮助"
      >
        <p class="muted">{{ section.body }}</p>
      </CollapsiblePanel>

      <CollapsiblePanel title="卸载插件包" subtitle="移除已知插件目录和部分配置目录" badge="危险操作" badge-state="danger">
        <p v-if="store.selectedRoot" class="inline-path">
          当前目录：<code>{{ store.selectedRoot }}</code>
        </p>
        <p v-else class="muted">请先在安装检查页选择 CS2 目录。</p>
        <button class="ghost-button danger-button" :disabled="!store.selectedRoot || store.busy" @click="uninstallModalOpen = true">
          卸载插件包
        </button>
      </CollapsiblePanel>
    </div>

    <ActionModal
      :open="uninstallModalOpen"
      title="确认卸载插件包"
      subtitle="这个操作只删除已知的 CS2-Bot-Improver 插件目录和配置目录。"
      confirm-label="确认卸载"
      danger
      @close="uninstallModalOpen = false"
      @confirm="uninstallBotPackage"
    >
      <p class="muted">
        将删除 BotAI、BotAimImprover、BotBuy、BotRandomizer、BotState、NadeSystem、BotTaunt、RoundDamageRecap 等插件目录，
        以及 BotTaunt 和 NadeSystem 配置目录。它不会删除或恢复 <code>gameinfo.gi</code> 与 <code>pak01_*.vpk</code>。
      </p>
      <p v-if="store.selectedRoot" class="inline-path">
        当前目录：<code>{{ store.selectedRoot }}</code>
      </p>
    </ActionModal>
  </section>
</template>
