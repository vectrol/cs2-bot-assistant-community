<script setup lang="ts">
withDefaults(
  defineProps<{
    title?: string
    message: string
    state?: 'ready' | 'warn' | 'danger' | 'info'
  }>(),
  {
    title: '',
    state: 'info',
  },
)
</script>

<template>
  <div class="inline-notice" :data-state="state" role="status">
    <strong v-if="title">{{ title }}</strong>
    <span>{{ message }}</span>
  </div>
</template>
