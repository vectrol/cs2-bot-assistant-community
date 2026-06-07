<script setup lang="ts">
import { useWorkspaceStore } from '@/stores/workspace'

const workspace = useWorkspaceStore()

const statusLabels: Record<string, string> = {
  queued: '排队中',
  running: '运行中',
  blocked: '已阻塞',
  done: '已完成',
}
</script>

<template>
  <section class="panel">
    <p class="eyebrow">执行队列</p>
    <ul class="queue-list">
      <li v-for="item in workspace.queue" :key="item.id" class="queue-item">
        <div>
          <strong>{{ item.title }}</strong>
          <p class="muted">{{ item.id }} / {{ item.projectId }} / 负责人：{{ item.owner }}</p>
        </div>
        <span class="pill" :data-status="item.status">{{ statusLabels[item.status] ?? item.status }}</span>
      </li>
    </ul>
  </section>
</template>
