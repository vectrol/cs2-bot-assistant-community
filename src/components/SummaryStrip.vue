<script setup lang="ts">
defineProps<{
  items: Array<{
    label: string
    value: string
    state?: 'ready' | 'warn' | 'danger'
  }>
}>()
</script>

<template>
  <div class="summary-strip">
    <div v-for="item in items" :key="item.label" class="summary-strip__item" :data-state="item.state ?? 'ready'">
      <span>{{ item.label }}</span>
      <strong>{{ item.value }}</strong>
    </div>
  </div>
</template>
