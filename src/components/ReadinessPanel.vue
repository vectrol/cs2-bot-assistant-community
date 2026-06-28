<script setup lang="ts">
import { computed } from 'vue'

import { useCs2Store } from '@/stores/cs2'

const store = useCs2Store()

const rows = computed(() => [
  {
    label: 'CS2 目录',
    value: store.selectedRoot ? '已选择' : '未选择',
    detail: store.selectedRoot || '先选择 Counter-Strike Global Offensive 根目录',
    state: store.selectedRoot ? 'ready' as const : 'warn' as const,
  },
  {
    label: '环境',
    value: store.environment?.baseEnvironmentReady ? '已就绪' : '待安装',
    detail: store.environment ? '基础插件环境检查结果' : '选择目录后自动检查',
    state: store.environment?.baseEnvironmentReady ? 'ready' as const : 'warn' as const,
  },
  {
    label: '游戏',
    value: store.cs2Running ? '运行中' : '未运行',
    detail: store.cs2Running ? '写入前请先退出 CS2' : '可以进行目录检查和配置',
    state: store.cs2Running ? 'danger' as const : 'ready' as const,
  },
])
</script>

<template>
  <section class="readiness-panel" aria-label="全局状态">
    <div class="readiness-panel__head">
      <p class="eyebrow">全局状态</p>
      <span v-if="store.busy" class="status-badge" data-state="info">处理中</span>
    </div>

    <div class="readiness-panel__rows">
      <div v-for="row in rows" :key="row.label" class="readiness-row" :data-state="row.state">
        <span class="readiness-row__dot" aria-hidden="true" />
        <div>
          <strong>{{ row.label }}：{{ row.value }}</strong>
          <small>{{ row.detail }}</small>
        </div>
      </div>
    </div>
  </section>
</template>
