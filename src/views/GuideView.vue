<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import ActionModal from '@/components/ActionModal.vue'
import CopyButton from '@/components/CopyButton.vue'
import DiagnosticsPanel from '@/components/DiagnosticsPanel.vue'
import StatusHero from '@/components/StatusHero.vue'
import SummaryStrip from '@/components/SummaryStrip.vue'
import wechatRewardImage from '@/assets/images/wechat-reward.png'
import { guideSections } from '@/features/cs2/data'
import { openDiagnosticsLogDirectory } from '@/services/tauri/cs2'
import { openExternalUrl } from '@/services/tauri/app'
import { useCs2Store } from '@/stores/cs2'
import { useUiPreferencesStore } from '@/stores/ui-preferences'

const store = useCs2Store()
const preferences = useUiPreferencesStore()
const groupMessage = ref('')
const uninstallModalOpen = ref(false)
const rewardVisible = ref(false)
const rewardMessage = ref('')
const groupUrl = 'https://qm.qq.com/q/QRlMlc1h2E'

const summaryItems = computed(() => [
  { label: '交流群', value: '可打开或复制', state: 'ready' as const },
  { label: '当前目录', value: store.selectedRoot || '未选择', state: store.selectedRoot ? 'ready' as const : 'warn' as const },
  { label: 'FAQ', value: `${guideSections.length} 条`, state: 'ready' as const },
])

const heroBadges = computed(() => [
  {
    label: store.selectedRoot ? '目录已选择' : '目录未选择',
    state: store.selectedRoot ? 'ready' as const : 'warn' as const,
  },
])

function handleGroupCopied() {
  groupMessage.value = '群链接已复制。'
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
    const message = store.normalizeError(error)
    preferences.recordError(message, '卸载插件包')
    store.setMessage(`${message} 可以重新检查目录，或复制诊断信息继续排查。`)
  }
}

async function refreshDiagnosticsPanel() {
  try {
    await store.refreshCs2Running()
    if (store.selectedRoot) {
      await store.refreshEnvironment()
    }
    await store.refreshDiagnostics()
    preferences.recordAction('刷新诊断', store.selectedRoot || '未选择目录')
  } catch (error) {
    const message = store.normalizeError(error)
    preferences.recordError(message, '刷新诊断')
    store.setMessage(`${message} 可以返回安装页重新选择目录后再读取。`)
  }
}

async function openLogs() {
  try {
    const result = await openDiagnosticsLogDirectory()
    store.setMessage(result.message)
    preferences.recordAction('打开日志位置', store.diagnostics?.logPath || '日志目录')
  } catch (error) {
    const message = store.normalizeError(error)
    preferences.recordError(message, '打开日志位置')
    store.setMessage(`${message} 可以先复制诊断信息，把日志路径发给维护者。`)
  }
}

function openRewardModal() {
  rewardMessage.value = ''
  rewardVisible.value = true
}

function closeRewardModal() {
  rewardVisible.value = false
  rewardMessage.value = '感谢你的支持与理解。'
}

onMounted(async () => {
  preferences.load()
  await refreshDiagnosticsPanel()
})

</script>

<template>
  <section class="page-grid">
    <StatusHero
      eyebrow="帮助中心"
      title="卡住时先看这里"
      description="按安装、运行、联机、卸载和保留内容来找答案。"
      :badges="heroBadges"
    >
      <template #actions>
        <button class="ghost-button" @click="openGroupUrl">打开交流群</button>
        <CopyButton :text="groupUrl" label="复制群链接" copied-label="已复制群链接" @copied="handleGroupCopied" />
      </template>
    </StatusHero>
    <p v-if="groupMessage" class="message-line">{{ groupMessage }}</p>

    <SummaryStrip :items="summaryItems" />

    <DiagnosticsPanel
      :root-path="store.selectedRoot"
      :environment="store.environment"
      :cs2-running="store.cs2Running"
      :diagnostics="store.diagnostics"
      :last-error="preferences.lastError"
      :busy="store.busy"
      @refresh="refreshDiagnosticsPanel"
      @open-logs="openLogs"
    />

    <section class="faq-grid">
      <article v-for="section in guideSections" :key="section.title" class="card faq-item">
        <p class="eyebrow">场景帮助</p>
        <h3>{{ section.title }}</h3>
        <p class="muted">{{ section.body }}</p>
      </article>
    </section>

    <section class="support-maintenance card">
      <div class="section-head">
        <div>
          <p class="eyebrow">自愿支持</p>
          <h3>支持维护</h3>
        </div>
      </div>
      <div class="support-maintenance__content">
        <div class="support-maintenance__copy">
          <p class="muted">
            这个助手壳软件由我独立开发和长期维护；插件内容来自社区协作，我也参与了其中一小部分开发。
            过去一段时间我也一直免费提供相关 AI 服务和维护支持。
          </p>
          <p class="muted">
            如果它确实帮你省了时间，可以自愿给一点小额赞赏，帮我继续承担维护和 AI 服务成本。
          </p>
          <p class="muted">
            赞赏完全自愿，不赞赏也不会影响插件、助手软件、AI 服务或任何功能使用。
          </p>
          <p class="support-maintenance__note">请按自己的情况决定，感谢理解。</p>
          <button
            class="ghost-button"
            type="button"
            @click="openRewardModal"
          >
            查看赞赏码
          </button>
          <p v-if="rewardMessage" class="reward-thanks-message">{{ rewardMessage }}</p>
        </div>
      </div>
    </section>

    <div v-if="rewardVisible" class="reward-modal" role="dialog" aria-modal="true" aria-label="微信赞赏码">
      <div class="reward-modal__backdrop" @click="closeRewardModal"></div>
      <div class="reward-modal__panel">
        <button class="reward-modal__close" type="button" aria-label="关闭赞赏码" @click="closeRewardModal">
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <path d="m7 7 10 10" />
            <path d="m17 7-10 10" />
          </svg>
        </button>
        <img class="reward-modal__image" :src="wechatRewardImage" alt="微信赞赏码" />
      </div>
    </div>

    <section class="danger-zone card">
      <div class="section-head">
        <div>
          <p class="eyebrow">危险操作</p>
          <h3>卸载插件包</h3>
        </div>
      </div>
      <p v-if="store.selectedRoot" class="inline-path">
        当前目录：<code>{{ store.selectedRoot }}</code>
      </p>
      <p v-else class="muted">请先在安装检查页选择 CS2 目录。</p>
      <p class="muted">这里只删除已知插件目录、对应配置目录和旧版 BotHider 0.1.9 残留，不会动 CS2 本体。</p>
      <button class="ghost-button danger-button" :disabled="!store.selectedRoot || store.busy" @click="uninstallModalOpen = true">
        卸载插件包
      </button>
    </section>

    <ActionModal
      :open="uninstallModalOpen"
      title="确认卸载插件包"
      subtitle="这个操作会删除已知插件目录、配置目录，并清理旧版 BotHider 0.1.9 残留。"
      confirm-label="确认卸载"
      danger
      :loading="store.busy"
      @close="uninstallModalOpen = false"
      @confirm="uninstallBotPackage"
    >
      <p class="muted">
        将删除 BotAI、BotAimImprover、BotBuy、BotRandomizer、BotState、NadeSystem、BotTaunt、RoundDamageRecap、MapRotation 等插件目录，
        以及 BotTaunt 和 NadeSystem 配置目录。也会清理旧版 BotHider 0.1.9 残留的 <code>BotHider.vdf</code>、<code>0Harmony</code> 和 <code>BotHiderApi</code>。
        它不会删除或恢复 <code>gameinfo.gi</code> 与 <code>pak01_*.vpk</code>。
      </p>
      <p v-if="store.selectedRoot" class="inline-path">
        当前目录：<code>{{ store.selectedRoot }}</code>
      </p>
    </ActionModal>
  </section>
</template>
