<script setup lang="ts">
import { computed } from 'vue'

import StatusPill from '@/components/ui/StatusPill.vue'
import { appConfig } from '@/config/app'
import { useCs2Store } from '@/stores/cs2'

const store = useCs2Store()

const environmentState = computed(() => {
  if (!store.selectedRoot) {
    return { label: '目录', value: '未选择', state: 'warn' as const }
  }
  if (store.readyForConfig) {
    return { label: '环境', value: '就绪', state: 'ready' as const }
  }
  return { label: '环境', value: '待安装', state: 'warn' as const }
})
</script>

<template>
  <section class="global-status-bar" aria-label="全局状态">
    <div class="global-status-bar__pills">
      <StatusPill
        label="CS2"
        :value="store.cs2Running ? '运行中' : '未运行'"
        :state="store.cs2Running ? 'danger' : 'ready'"
      />
      <StatusPill
        :label="environmentState.label"
        :value="environmentState.value"
        :state="environmentState.state"
      />
      <StatusPill
        label="目录"
        :value="store.selectedRoot ? '已锁定' : '待选择'"
        :state="store.selectedRoot ? 'ready' : 'warn'"
      />
      <StatusPill label="版本" :value="`v${appConfig.appVersion}`" state="info" />
    </div>

    <div class="global-status-bar__trail">
      <span v-if="store.busy">正在处理任务</span>
      <span v-else>等待操作</span>
    </div>
  </section>
</template>
