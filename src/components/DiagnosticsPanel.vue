<script setup lang="ts">
import { computed } from 'vue'

import { appConfig } from '@/config/app'
import CopyButton from '@/components/CopyButton.vue'
import type { Cs2EnvironmentStatus, DiagnosticsPayload } from '@/types/cs2'

const props = defineProps<{
  rootPath: string | null
  environment: Cs2EnvironmentStatus | null
  cs2Running: boolean
  diagnostics: DiagnosticsPayload | null
  lastError: { message: string; context: string; at: string } | null
  busy: boolean
}>()

defineEmits<{
  refresh: []
  openLogs: []
}>()

const checks = computed(() => {
  if (!props.environment) return []
  return [
    { label: 'game 文件夹', ok: props.environment.gameDirExists },
    { label: 'csgo 文件夹', ok: props.environment.csgoDirExists },
    { label: 'gameinfo.gi', ok: props.environment.gameinfoExists },
    { label: 'MetaMod', ok: props.environment.metamodExists },
    { label: 'CounterStrikeSharp', ok: props.environment.counterstrikeSharpExists },
    { label: 'CSS core.json', ok: props.environment.coreConfigExists },
    { label: 'BotHider', ok: props.environment.botHiderExists },
    { label: 'BotHiderImpl', ok: props.environment.botHiderImplExists },
    { label: 'RayTrace', ok: props.environment.rayTraceExists },
    { label: 'RayTraceImpl', ok: props.environment.rayTraceImplExists },
    { label: 'RoundDamageRecap', ok: props.environment.roundDamageRecapExists },
    { label: 'InventorySimulator', ok: props.environment.inventorySimulatorExists },
    { label: '难度-低', ok: props.environment.lowProfileExists },
    { label: '难度-中', ok: props.environment.mediumProfileExists },
    { label: '难度-高', ok: props.environment.highProfileExists },
    { label: 'botprofile.vpk', ok: props.environment.activeBotprofileExists },
    { label: '备份-Online', ok: props.environment.backupOnlineGameinfoExists },
    { label: '备份-WithBots', ok: props.environment.backupWithbotsGameinfoExists },
  ]
})

const readyCount = computed(() => checks.value.filter((c) => c.ok).length)

const copyText = computed(() => {
  const lines = [
    `CS2人机助手社区版 v${appConfig.appVersion}`,
    `目录：${props.rootPath || '未选择'}`,
    `游戏模式：${props.environment?.activeGameMode === 'withBots' ? 'Bot模式' : props.environment?.activeGameMode === 'online' ? '在线模式' : '未知'}`,
    `CS2运行中：${props.cs2Running ? '是' : '否'}`,
    `环境检查：${readyCount.value}/${checks.value.length}`,
    ...checks.value.map((c) => `  ${c.ok ? '[OK]' : '[--]'} ${c.label}`),
    `日志路径：${props.diagnostics?.logPath || '-'}`,
    props.lastError ? `最近错误：${props.lastError.message} (${props.lastError.context})` : '',
  ]
  return lines.filter(Boolean).join('\n')
})
</script>

<template>
  <article class="card diagnostics-panel">
    <div class="section-head">
      <div>
        <p class="eyebrow">Diagnostics</p>
        <h3>环境诊断</h3>
      </div>
      <div class="diagnostics-actions">
        <button class="ghost-button" type="button" :disabled="busy" @click="$emit('refresh')">
          刷新
        </button>
        <button class="ghost-button" type="button" @click="$emit('openLogs')">
          打开日志
        </button>
        <CopyButton :text="copyText" label="复制诊断" copied-label="已复制" />
      </div>
    </div>

    <div class="diagnostics-status-row">
      <span class="status-pill" :data-state="cs2Running ? 'warn' : 'ready'">
        {{ cs2Running ? 'CS2运行中' : 'CS2未运行' }}
      </span>
      <span class="status-pill" :data-state="!environment ? 'warn' : environment.baseEnvironmentReady ? 'ready' : 'warn'">
        {{ !environment ? '未检查' : environment.baseEnvironmentReady ? `环境就绪 (${readyCount}/${checks.length})` : `环境不完整 (${readyCount}/${checks.length})` }}
      </span>
      <span v-if="environment" class="status-pill" data-state="info">
        {{ environment.activeGameMode === 'withBots' ? 'Bot模式' : '在线模式' }}
      </span>
    </div>

    <div class="diagnostics-grid">
      <article
        v-for="check in checks"
        :key="check.label"
        class="check-row"
        :data-ok="check.ok"
      >
        <span class="check-dot" :data-ok="check.ok" />
        <strong>{{ check.label }}</strong>
      </article>
    </div>

    <div v-if="diagnostics?.summary" class="diagnostics-log">
      <p class="eyebrow">详细日志摘要</p>
      <pre>{{ diagnostics.summary }}</pre>
    </div>

    <div v-if="lastError" class="diagnostics-error">
      <p class="eyebrow">最近错误</p>
      <code>{{ lastError.message }} ({{ lastError.context }})</code>
    </div>
  </article>
</template>

<style scoped>
.diagnostics-actions {
  display: flex;
  gap: 0.4rem;
  align-items: center;
}

.diagnostics-status-row {
  display: flex;
  gap: 0.5rem;
  margin: 0.75rem 0;
  flex-wrap: wrap;
}

.diagnostics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 0.375rem;
  margin: 0.5rem 0;
}

.check-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.35rem 0.5rem;
  border-radius: var(--radius-sm);
  background: var(--ghost-bg);
  font-size: var(--fs-sm);
}

.check-row[data-ok='true'] {
  opacity: 1;
}

.check-row[data-ok='false'] {
  opacity: 0.55;
}

.check-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.check-dot[data-ok='true'] {
  background: var(--success-text);
}

.check-dot[data-ok='false'] {
  background: var(--border-muted, rgba(148, 163, 184, 0.3));
}

.diagnostics-log {
  margin-top: 1rem;
}

.diagnostics-log pre {
  margin: 0.4rem 0 0;
  padding: 0.75rem;
  border-radius: var(--radius-sm);
  background: var(--field-bg);
  font-size: var(--fs-xs);
  font-family: var(--font-mono);
  line-height: 1.5;
  max-height: 300px;
  overflow: auto;
  white-space: pre-wrap;
}

.diagnostics-error {
  margin-top: 1rem;
}

.diagnostics-error code {
  display: block;
  margin-top: 0.25rem;
  font-size: var(--fs-xs);
  color: var(--danger-text);
  word-break: break-all;
}
</style>
