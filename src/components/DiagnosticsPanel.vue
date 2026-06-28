<script setup lang="ts">
import { computed } from 'vue'

import CopyButton from '@/components/CopyButton.vue'
import { appConfig } from '@/config/app'
import type { Cs2EnvironmentStatus, DiagnosticsPayload } from '@/types/cs2'
import type { LastErrorInfo, RestorePoint } from '@/stores/ui-preferences'

const props = defineProps<{
  rootPath: string
  environment: Cs2EnvironmentStatus | null
  cs2Running: boolean
  diagnostics: DiagnosticsPayload | null
  lastError: LastErrorInfo | null
  restorePoints: RestorePoint[]
  busy?: boolean
}>()

const emit = defineEmits<{
  refresh: []
  openLogs: []
}>()

const diagnosticText = computed(() => [
  `应用版本：${appConfig.appVersion}`,
  `当前目录：${props.rootPath || '未选择'}`,
  `基础环境：${props.environment?.baseEnvironmentReady ? '已就绪' : '未就绪'}`,
  `CS2 状态：${props.cs2Running ? '正在运行' : '未运行'}`,
  `日志路径：${props.diagnostics?.logPath || '未读取'}`,
  `最近错误：${props.lastError ? `${props.lastError.context} / ${props.lastError.message}` : '无'}`,
  `恢复点数量：${props.restorePoints.length}`,
].join('\n'))

const environmentRows = computed(() => [
  { label: 'game 文件夹', ok: props.environment?.gameDirExists ?? false },
  { label: 'csgo 文件夹', ok: props.environment?.csgoDirExists ?? false },
  { label: 'MetaMod', ok: props.environment?.metamodExists ?? false },
  { label: 'CounterStrikeSharp', ok: props.environment?.counterstrikeSharpExists ?? false },
  { label: 'gameinfo.gi', ok: props.environment?.gameinfoExists ?? false },
])
</script>

<template>
  <article class="card diagnostics-panel">
    <div class="section-head">
      <div>
        <p class="eyebrow">诊断面板</p>
        <h3>复制这些信息，后续排查就不用重新猜。</h3>
      </div>
      <div class="actions-row">
        <button class="ghost-button" type="button" :disabled="busy" @click="emit('refresh')">
          重新读取
        </button>
        <button class="ghost-button" type="button" :disabled="busy" @click="emit('openLogs')">
          打开日志位置
        </button>
        <CopyButton :text="diagnosticText" label="复制诊断信息" copied-label="已复制诊断" />
      </div>
    </div>

    <div class="diagnostics-grid">
      <div>
        <span>应用版本</span>
        <strong>v{{ appConfig.appVersion }}</strong>
      </div>
      <div>
        <span>当前目录</span>
        <strong>{{ rootPath || '未选择' }}</strong>
      </div>
      <div>
        <span>运行状态</span>
        <strong>{{ cs2Running ? 'CS2 正在运行' : 'CS2 未运行' }}</strong>
      </div>
      <div>
        <span>日志路径</span>
        <strong>{{ diagnostics?.logPath || '未读取' }}</strong>
      </div>
    </div>

    <div class="status-list">
      <div v-for="row in environmentRows" :key="row.label" class="status-row">
        <span>{{ row.label }}</span>
        <strong :data-ok="row.ok">{{ row.ok ? '已找到' : '未找到' }}</strong>
      </div>
    </div>

    <div v-if="lastError" class="inline-notice" data-state="danger">
      <strong>最近一次错误</strong>
      <span>{{ lastError.context }}：{{ lastError.message }}</span>
    </div>

    <div class="restore-list">
      <p class="eyebrow">最近恢复点</p>
      <div v-if="restorePoints.length === 0" class="empty-state">
        <strong>还没有写入恢复点</strong>
        <p class="muted">执行安装、模式切换或配置保存前会自动记录。</p>
      </div>
      <div v-for="point in restorePoints.slice(0, 4)" :key="point.id" class="restore-item">
        <strong>{{ point.operation }}</strong>
        <span>{{ point.scope }}</span>
        <small>{{ point.at }} · {{ point.rollbackAvailable ? '可回滚' : '记录用途' }}</small>
      </div>
    </div>
  </article>
</template>
