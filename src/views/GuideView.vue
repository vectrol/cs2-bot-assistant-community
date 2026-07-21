<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { open } from '@tauri-apps/plugin-dialog'

import ActionModal from '@/components/ActionModal.vue'
import DiagnosticsPanel from '@/components/DiagnosticsPanel.vue'
import InlineNotice from '@/components/ui/InlineNotice.vue'
import { guideSections } from '@/features/cs2/data'
import { openDiagnosticsLogDirectory } from '@/services/tauri/cs2'
import { useCs2Store } from '@/stores/cs2'
import { useUiPreferencesStore } from '@/stores/ui-preferences'

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
    { label: 'CSS核心', ok: e.coreConfigExists }, { label: 'Inventory', ok: e.inventorySimulatorExists },
  ]
})

const canInstall = computed(() => store.selectedRoot && !store.cs2Running && store.environment)
const installStatus = computed(() => {
  if (!store.environment) return ''
  return store.environment.baseEnvironmentReady ? '已安装 (可重装)' : '未安装'
})

function selectDirectory(path: string) {
  store.selectRoot(path)
  store.refreshEnvironment()
}

async function browseDirectory() {
  const dir = await open({ directory: true, multiple: false, title: '选择 CS2 根目录' })
  if (dir) selectDirectory(dir as string)
}

async function scanRoots() {
  await store.scanRoots()
}

function canWrite() {
  if (store.cs2Running) { store.setMessage('CS2 正在运行，请先退出游戏再写入。'); return false }
  if (!store.selectedRoot) { store.setMessage('请先选择 CS2 目录。'); return false }
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
  preferences.recordAction('刷新环境', store.selectedRoot || '未选择')
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
    <article class="hero-banner install-hero">
      <div>
        <p class="eyebrow">环境管理</p>
        <h2>{{ store.selectedRoot ? 'CS2 目录已选择' : '选择 CS2 目录' }}</h2>
        <p class="muted">
          {{ store.selectedRoot ? store.selectedRoot : '需要先找到 Counter-Strike Global Offensive 根目录才能安装插件。' }}
        </p>
      </div>
      <div class="install-hero__actions">
        <button class="ghost-button" type="button" :disabled="store.busy" @click="scanRoots">扫描目录</button>
        <button class="ghost-button" type="button" @click="browseDirectory">手动选择</button>
        <button
          class="primary-button install-hero-button"
          type="button"
          :disabled="!canInstall"
          @click="installConfirmOpen = true"
        >
          {{ installStatus || '安装插件包' }}
        </button>
      </div>
    </article>

    <div v-if="store.candidates.length > 0" class="install-candidates">
      <p class="eyebrow">发现的 CS2 目录</p>
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
      message="CS2 正在运行，安装、卸载、切换模式前请先退出游戏。"
      state="warn"
    />

    <article v-if="store.environment" class="card env-status-card">
      <div class="section-head">
        <div>
          <p class="eyebrow">环境检查</p>
          <h3>插件安装状态</h3>
        </div>
        <span class="status-pill" :data-state="store.environment.baseEnvironmentReady ? 'ready' : 'warn'">
          {{ store.environment.baseEnvironmentReady ? '就绪' : '未安装' }}
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
      <article v-for="section in guideSections" :key="section.title" class="card faq-item">
        <p class="eyebrow">场景帮助</p>
        <h3>{{ section.title }}</h3>
        <p class="muted">{{ section.body }}</p>
      </article>
    </section>

    <section class="danger-zone card">
      <div class="section-head">
        <div>
          <p class="eyebrow">危险操作</p>
          <h3>卸载插件包</h3>
        </div>
      </div>
      <p class="muted">卸载会彻底删除 addons/plugins/cfg/plugins 和 MetaMod 加载文件，不会删除 CS2 本体。</p>
      <button class="ghost-button danger-button" :disabled="!store.selectedRoot || store.busy" @click="uninstallModalOpen = true">
        卸载插件包
      </button>
    </section>

    <ActionModal
      :open="installConfirmOpen"
      title="确认安装插件包"
      subtitle="安装前会清理旧插件和残留文件，需要退出 CS2。"
      confirm-label="确认安装"
      :loading="store.busy"
      @close="installConfirmOpen = false"
      @confirm="installPackage"
    >
      <label class="checkbox-row"><input v-model="confirmExited" type="checkbox" /> 我已退出 CS2</label>
      <label class="checkbox-row"><input v-model="confirmRoot" type="checkbox" /> 已确认目录正确</label>
    </ActionModal>

    <ActionModal
      :open="uninstallModalOpen"
      title="确认卸载插件包"
      subtitle="这个操作不可恢复，会彻底删除现有插件包和所有插件配置。"
      confirm-label="确认卸载"
      danger
      :loading="store.busy"
      @close="uninstallModalOpen = false"
      @confirm="uninstallBotPackage"
    >
      <p class="muted">将删除 addons、plugins、cfg\plugins 及 MetaMod 加载文件。不会删除游戏本体。</p>
    </ActionModal>
  </section>
</template>

<style scoped>
.install-hero {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 1rem;
  align-items: start;
}

.install-hero__actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.install-hero-button {
  min-width: 140px;
}

.install-candidates {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.candidate-item {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  padding: 0.5rem 0.7rem;
  border: 1px solid var(--panel-border);
  border-radius: var(--radius-sm);
  background: var(--panel-bg);
  text-align: left;
  cursor: pointer;
  transition: border-color 0.15s;
}

.candidate-item:hover { border-color: var(--active-border); }
.candidate-item[data-active='true'] { border-color: var(--accent); background: var(--active-bg); }
.candidate-item code { font-size: var(--fs-xs); word-break: break-all; }
.candidate-item small { font-size: var(--fs-xs); color: var(--muted-color); }

.env-status-card { padding: 0.75rem 1rem; }
.env-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 0.3rem;
  margin-top: 0.5rem;
}
.env-dot {
  display: flex; align-items: center; gap: 0.4rem;
  font-size: var(--fs-sm); opacity: 0.55;
}
.env-dot[data-ok='true'] { opacity: 1; }
.env-dot__indicator {
  width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0;
  background: var(--border-muted);
}
.env-dot[data-ok='true'] .env-dot__indicator { background: var(--success-text); }

.checkbox-row {
  display: flex; align-items: center; gap: 0.5rem;
  font-size: var(--fs-sm); padding: 0.25rem 0;
}
</style>
