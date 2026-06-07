<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { open } from '@tauri-apps/plugin-dialog'

import ActionModal from '@/components/ActionModal.vue'
import CollapsiblePanel from '@/components/CollapsiblePanel.vue'
import SummaryStrip from '@/components/SummaryStrip.vue'
import { useCs2Store } from '@/stores/cs2'

const store = useCs2Store()
const installConfirmOpen = ref(false)
const diagnosticsOpen = ref(false)

const checklist = [
  '确认选择的是 CS2 根目录，而不是 game 或 csgo 子目录。',
  '安装完成后，在 Steam 启动项里手动加入 -insecure。',
  '后续切换难度、模式或插件配置前，请先退出 CS2。',
]

const statusRows = computed(() => {
  if (!store.environment) {
    return []
  }

  return [
    { label: 'game 文件夹', value: store.environment.gameDirExists },
    { label: 'csgo 文件夹', value: store.environment.csgoDirExists },
    { label: 'MetaMod', value: store.environment.metamodExists },
    { label: 'CounterStrikeSharp', value: store.environment.counterstrikeSharpExists },
    { label: 'gameinfo.gi', value: store.environment.gameinfoExists },
    { label: 'overrides/botprofile.vpk', value: store.environment.activeBotprofileExists },
    { label: 'backup/Online/gameinfo.gi', value: store.environment.backupOnlineGameinfoExists },
    { label: 'backup/WithBots/gameinfo.gi', value: store.environment.backupWithbotsGameinfoExists },
    { label: 'overrides/Low/botprofile.vpk', value: store.environment.lowProfileExists },
    { label: 'overrides/Medium/botprofile.vpk', value: store.environment.mediumProfileExists },
    { label: 'overrides/High/botprofile.vpk', value: store.environment.highProfileExists },
  ]
})

const summaryItems = computed(() => [
  {
    label: 'CS2 目录',
    value: store.selectedRoot || '未选择',
    state: store.selectedRoot ? 'ready' as const : 'warn' as const,
  },
  {
    label: '游戏运行状态',
    value: store.cs2Running ? '正在运行' : '未运行',
    state: store.cs2Running ? 'danger' as const : 'ready' as const,
  },
  {
    label: '安装环境',
    value: store.environment?.baseEnvironmentReady ? '已就绪' : '待安装',
    state: store.environment?.baseEnvironmentReady ? 'ready' as const : 'warn' as const,
  },
])

async function handleBrowse() {
  try {
    const result = await open({
      directory: true,
      multiple: false,
      title: '选择 CS2 游戏目录',
    })

    if (typeof result === 'string') {
      await store.selectRoot(result)
      await store.refreshDiagnostics()
      store.setMessage(`已选择：${store.selectedRoot}`)
    }
  } catch (error) {
    store.setMessage(store.normalizeError(error))
  }
}

async function handleInstall() {
  try {
    await store.install()
    installConfirmOpen.value = false
  } catch (error) {
    store.setMessage(store.normalizeError(error))
  } finally {
    await store.refreshDiagnostics()
  }
}

onMounted(async () => {
  await store.scanRoots()
  await store.refreshCs2Running()
  await store.refreshDiagnostics()
})
</script>

<template>
  <section class="page-grid">
    <article class="hero-banner">
      <div>
        <p class="eyebrow">安装检查</p>
        <h2>先选对 CS2 目录，再开始安装。</h2>
      </div>
      <div class="hero-status">
        <span class="status-badge" :data-state="store.environment?.baseEnvironmentReady ? 'ready' : 'warn'">
          {{ store.environment?.baseEnvironmentReady ? '环境已就绪' : '环境尚未就绪' }}
        </span>
        <span class="status-badge" :data-state="store.cs2Running ? 'danger' : 'ready'">
          {{ store.cs2Running ? '检测到 CS2 正在运行' : '当前未检测到 CS2 运行' }}
        </span>
      </div>
    </article>

    <SummaryStrip :items="summaryItems" />

    <div class="content-grid two-column">
      <article class="card">
        <div class="section-head">
          <div>
            <p class="eyebrow">游戏目录</p>
            <h3>当前选择</h3>
          </div>
        </div>

        <p v-if="store.selectedRoot" class="inline-path">
          当前目录：<code>{{ store.selectedRoot }}</code>
        </p>
        <p v-else class="muted">暂时没有选择目录，可以手动选择或展开候选目录。</p>

        <div class="actions-row">
          <button class="primary-button" @click="handleBrowse">手动选择目录</button>
          <button class="ghost-button" :disabled="store.busy" @click="store.scanRoots()">重新扫描</button>
          <button class="ghost-button" :disabled="!store.selectedRoot" @click="store.refreshEnvironment()">
            重新检查
          </button>
        </div>
      </article>

      <article class="card">
        <div class="section-head">
          <div>
            <p class="eyebrow">安装环境</p>
            <h3>环境摘要</h3>
          </div>
        </div>

        <div v-if="store.environment && !store.environment.baseEnvironmentReady" class="tip-box">
          当前目录里的 Bot 环境尚未安装完整。可以先执行安装，完成后再回来检查一次。
        </div>
        <div v-else-if="store.environment" class="tip-box">
          当前目录检查通过，可以进入游戏设置页切换难度、模式和插件配置。
        </div>
        <p v-else class="muted">选好目录后，这里会显示检查结果。</p>

        <button class="primary-button wide" :disabled="!store.selectedRoot || store.busy" @click="installConfirmOpen = true">
          开始安装
        </button>
      </article>
    </div>

    <CollapsiblePanel title="候选目录列表" :subtitle="store.candidates.length ? `${store.candidates.length} 个候选目录` : '没有自动找到目录'" badge="可切换" default-open>
      <div v-if="store.candidates.length > 0" class="candidate-list">
        <button
          v-for="candidate in store.candidates"
          :key="candidate.path"
          class="candidate-item"
          :data-active="candidate.path === store.selectedRoot"
          @click="store.selectRoot(candidate.path)"
        >
          <strong>{{ candidate.path }}</strong>
          <span>{{ candidate.source }}</span>
        </button>
      </div>
      <p v-else class="muted">暂时没有找到可用目录，请手动选择。</p>
    </CollapsiblePanel>

    <CollapsiblePanel title="完整检查结果" subtitle="展开查看每个文件和目录是否存在" :badge="statusRows.length ? '已检查' : '待检查'">
      <div v-if="statusRows.length > 0" class="status-list">
        <div v-for="row in statusRows" :key="row.label" class="status-row">
          <span>{{ row.label }}</span>
          <strong :data-ok="row.value">{{ row.value ? '已找到' : '未找到' }}</strong>
        </div>
      </div>
      <p v-else class="muted">选好目录后，这里会显示检查结果。</p>
    </CollapsiblePanel>

    <div class="actions-row">
      <button class="ghost-button" @click="diagnosticsOpen = true">查看日志和诊断</button>
    </div>

    <ActionModal
      :open="installConfirmOpen"
      title="安装前确认"
      subtitle="安装会写入当前 CS2 目录，Steam 启动项仍需要手动处理。"
      confirm-label="确认安装"
      @close="installConfirmOpen = false"
      @confirm="handleInstall"
    >
      <div class="checklist">
        <label v-for="item in checklist" :key="item" class="check-item">
          <input type="checkbox" />
          <span>{{ item }}</span>
        </label>
      </div>
      <p class="tip-box">
        程序会把内置文件安装到 <code>{{ store.selectedRoot || '你的 CS2 目录' }}\game\csgo</code>。Steam 启动项里的
        <code>-insecure</code> 仍需要你手动添加。
      </p>
    </ActionModal>

    <ActionModal
      :open="diagnosticsOpen"
      title="日志位置和详细诊断"
      cancel-label="关闭"
      hide-confirm
      @close="diagnosticsOpen = false"
      @confirm="diagnosticsOpen = false"
    >
      <p v-if="store.diagnostics?.logPath" class="inline-path">
        日志位置：<code>{{ store.diagnostics.logPath }}</code>
      </p>
      <p v-else class="muted">当前没有读取到日志路径。</p>
      <div v-if="statusRows.length > 0" class="status-list">
        <div v-for="row in statusRows" :key="`diagnostic:${row.label}`" class="status-row">
          <span>{{ row.label }}</span>
          <strong :data-ok="row.value">{{ row.value ? '已找到' : '未找到' }}</strong>
        </div>
      </div>
    </ActionModal>
  </section>
</template>
