<script setup lang="ts">
defineProps<{
  steps: Array<{
    title: string
    description?: string
    state: 'complete' | 'current' | 'pending' | 'manual' | 'blocked'
  }>
}>()

const labels = {
  complete: '已完成',
  current: '当前步骤',
  pending: '待处理',
  manual: '手动确认',
  blocked: '需处理',
}
</script>

<template>
  <ol class="task-stepper">
    <li v-for="(step, index) in steps" :key="step.title" class="task-step" :data-state="step.state">
      <span class="task-step__index">{{ index + 1 }}</span>
      <div class="task-step__body">
        <div class="task-step__head">
          <strong>{{ step.title }}</strong>
          <span>{{ labels[step.state] }}</span>
        </div>
        <p v-if="step.description" class="muted">{{ step.description }}</p>
      </div>
    </li>
  </ol>
</template>
