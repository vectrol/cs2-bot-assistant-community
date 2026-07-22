<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import { appConfig } from '@/config/app'
import CopyButton from '@/components/CopyButton.vue'
import type { Cs2EnvironmentStatus, DiagnosticsPayload } from '@/types/cs2'

const { t } = useI18n()

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
  const l = (key: string) => t(`diagnostics.checks.${key}`)
  return [
    { label: l('gameDir'), ok: props.environment.gameDirExists },
    { label: l('csgoDir'), ok: props.environment.csgoDirExists },
    { label: l('gameinfo'), ok: props.environment.gameinfoExists },
    { label: l('metamod'), ok: props.environment.metamodExists },
    { label: l('css'), ok: props.environment.counterstrikeSharpExists },
    { label: l('coreConfig'), ok: props.environment.coreConfigExists },
    { label: l('botHider'), ok: props.environment.botHiderExists },
    { label: l('botHiderImpl'), ok: props.environment.botHiderImplExists },
    { label: l('rayTrace'), ok: props.environment.rayTraceExists },
    { label: l('rayTraceImpl'), ok: props.environment.rayTraceImplExists },
    { label: l('roundDamageRecap'), ok: props.environment.roundDamageRecapExists },
    { label: l('inventorySimulator'), ok: props.environment.inventorySimulatorExists },
    { label: l('difficultyLow'), ok: props.environment.lowProfileExists },
    { label: l('difficultyMid'), ok: props.environment.mediumProfileExists },
    { label: l('difficultyHigh'), ok: props.environment.highProfileExists },
    { label: l('botprofile'), ok: props.environment.activeBotprofileExists },
    { label: l('backupOnline'), ok: props.environment.backupOnlineGameinfoExists },
    { label: l('backupWithBots'), ok: props.environment.backupWithbotsGameinfoExists },
  ]
})

const readyCount = computed(() => checks.value.filter((c) => c.ok).length)

const copyText = computed(() => {
  const env = props.environment
  const pluginLines: string[] = []
  if (env?.cssVersion) {
    pluginLines.push(`  CounterStrikeSharp v${env.cssVersion}`)
  }
  if (env?.pluginVersions) {
    for (const [name, ver] of Object.entries(env.pluginVersions)) {
      pluginLines.push(`  ${name} v${ver}`)
    }
  }
  const lines = [
    `CS2人机助手社区版 v${appConfig.appVersion}`,
    `目录：${props.rootPath || '未选择'}`,
    `游戏模式：${env?.activeGameMode === 'withBots' ? 'Bot模式' : env?.activeGameMode === 'online' ? '在线模式' : '未知'}`,
    `CS2运行中：${props.cs2Running ? '是' : '否'}`,
    `环境检查：${readyCount.value}/${checks.value.length}`,
    ...checks.value.map((c) => `  ${c.ok ? '[OK]' : '[--]'} ${c.label}`),
    ...(pluginLines.length ? ['插件版本：', ...pluginLines] : []),
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
        <h3>{{ t('diagnostics.title') }}</h3>
      </div>
      <div class="diagnostics-actions">
        <button class="ghost-button" type="button" :disabled="busy" @click="$emit('refresh')">
          {{ t('app.refresh') }}
        </button>
        <button class="ghost-button" type="button" @click="$emit('openLogs')">
          {{ t('guide.openLogs') }}
        </button>
        <CopyButton :text="copyText" :label="t('guide.copyDiagnostics')" :copied-label="t('guide.copied')" />
      </div>
    </div>

    <div class="diagnostics-status-row">
      <span class="status-pill" :data-state="cs2Running ? 'warn' : 'ready'">
        {{ cs2Running ? t('app.cs2Running') : t('app.cs2NotRunning') }}
      </span>
      <span class="status-pill" :data-state="!environment ? 'warn' : environment.baseEnvironmentReady ? 'ready' : 'warn'">
        {{ !environment ? t('guide.notChecked') : environment.baseEnvironmentReady ? `${t('guide.environmentReady')} (${readyCount}/${checks.length})` : `${t('guide.environmentIncomplete')} (${readyCount}/${checks.length})` }}
      </span>
      <span v-if="environment" class="status-pill" data-state="info">
        {{ environment.activeGameMode === 'withBots' ? t('quickControl.botMode') : t('quickControl.onlineMode') }}
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

    <template v-if="environment && environment.cssVersion">
      <hr class="diagnostics-divider">
      <div class="version-section">
        <p class="eyebrow">{{ t('diagnostics.pluginVersions') }}</p>
        <div class="version-grid">
          <article class="version-row">
            <span>CounterStrikeSharp</span>
            <code>{{ environment.cssVersion }}</code>
          </article>
          <article
            v-for="(ver, name) in environment.pluginVersions"
            :key="name"
            class="version-row"
          >
            <span>{{ name }}</span>
            <code>{{ ver }}</code>
          </article>
        </div>
      </div>
    </template>

    <div v-if="diagnostics?.summary" class="diagnostics-log">
      <p class="eyebrow">{{ t('guide.logSummary') }}</p>
      <pre>{{ diagnostics.summary }}</pre>
    </div>

    <div v-if="lastError" class="diagnostics-error">
      <p class="eyebrow">{{ t('guide.lastError') }}</p>
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

.diagnostics-divider {
  margin: 1rem 0;
  border: none;
  border-top: 1px solid var(--border-muted);
}

.version-section {
  margin: 0.5rem 0;
}

.version-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 0.3rem;
  margin-top: 0.4rem;
}

.version-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.3rem 0.5rem;
  border-radius: var(--radius-sm);
  background: var(--ghost-bg);
  font-size: var(--fs-sm);
}

.version-row code {
  font-size: var(--fs-xs);
  font-family: var(--font-mono);
  color: var(--accent-text);
  background: var(--field-bg);
  padding: 0.1rem 0.35rem;
  border-radius: var(--radius-xs);
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
