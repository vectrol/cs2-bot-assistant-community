<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useWorkspaceStore } from '@/stores/workspace'

const { t } = useI18n()
const workspace = useWorkspaceStore()

const statusLabels: Record<string, string> = {
  queued: t('workspace.tasks.statusQueued'),
  running: t('workspace.tasks.statusRunning'),
  blocked: t('workspace.tasks.statusBlocked'),
  done: t('workspace.tasks.statusDone'),
}
</script>

<template>
  <section class="panel">
    <p class="eyebrow">{{ t('workspace.tasks.title') }}</p>
    <ul class="queue-list">
      <li v-for="item in workspace.queue" :key="item.id" class="queue-item">
        <div>
          <strong>{{ item.title }}</strong>
          <p class="muted">{{ item.id }} / {{ item.projectId }} / {{ t('workspace.tasks.assignedTo') }}：{{ item.owner }}</p>
        </div>
        <span class="pill" :data-status="item.status">{{ statusLabels[item.status] ?? item.status }}</span>
      </li>
    </ul>
  </section>
</template>
