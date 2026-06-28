<script setup lang="ts">
withDefaults(
  defineProps<{
    title: string
    description: string
    badge?: string
    badgeState?: 'ready' | 'warn' | 'danger'
    defaultOpen?: boolean
  }>(),
  {
    badge: '',
    badgeState: 'ready',
    defaultOpen: false,
  },
)
</script>

<template>
  <details class="config-section card" :open="defaultOpen">
    <summary class="config-section__summary">
      <span class="config-section__copy">
        <span class="config-section__title">{{ title }}</span>
        <span class="config-section__description">{{ description }}</span>
      </span>
      <span v-if="badge" class="status-badge" :data-state="badgeState">{{ badge }}</span>
    </summary>

    <div class="config-section__body">
      <slot />
    </div>
  </details>
</template>
