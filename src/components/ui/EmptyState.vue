<script setup lang="ts">
withDefaults(
  defineProps<{
    title: string
    description?: string
    state?: 'ready' | 'warn' | 'danger' | 'info'
  }>(),
  {
    description: '',
    state: 'info',
  },
)
</script>

<template>
  <div class="empty-state" :data-state="state">
    <strong>{{ title }}</strong>
    <p v-if="description" class="muted">{{ description }}</p>
    <div v-if="$slots.default" class="empty-state__actions">
      <slot />
    </div>
  </div>
</template>
