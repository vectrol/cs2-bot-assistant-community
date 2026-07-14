<script setup lang="ts">
withDefaults(
  defineProps<{
    label: string
    value: string
    detail?: string
    state?: 'ready' | 'warn' | 'danger' | 'info' | 'neutral'
  }>(),
  {
    detail: '',
    state: 'neutral',
  },
)
</script>

<template>
  <article class="metric-tile" :data-state="state">
    <span>{{ label }}</span>
    <strong>{{ value }}</strong>
    <small v-if="detail">{{ detail }}</small>
  </article>
</template>
