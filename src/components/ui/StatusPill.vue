<script setup lang="ts">
withDefaults(
  defineProps<{
    label: string
    value?: string
    state?: 'ready' | 'warn' | 'danger' | 'info' | 'neutral'
  }>(),
  {
    value: '',
    state: 'neutral',
  },
)
</script>

<template>
  <span class="status-pill" :data-state="state">
    <span class="status-pill__dot" aria-hidden="true" />
    <span>{{ label }}</span>
    <strong v-if="value">{{ value }}</strong>
  </span>
</template>
