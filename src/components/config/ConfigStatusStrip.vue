<script setup lang="ts">
defineProps<{
  items: Array<{
    label: string
    value: string
    state: 'ready' | 'warn' | 'danger'
  }>
}>()
</script>

<template>
  <div class="config-status-strip">
    <div v-for="item in items" :key="item.label" class="config-status-strip__item" :data-state="item.state">
      <span>{{ item.label }}</span>
      <strong>{{ item.value }}</strong>
    </div>
  </div>
</template>
