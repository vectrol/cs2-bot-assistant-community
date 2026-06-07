<script setup lang="ts">
withDefaults(
  defineProps<{
    title: string
    subtitle?: string
    badge?: string
    badgeState?: 'ready' | 'warn' | 'danger'
    defaultOpen?: boolean
  }>(),
  {
    subtitle: '',
    badge: '',
    badgeState: 'ready',
    defaultOpen: false,
  },
)
</script>

<template>
  <details class="collapsible-panel card" :open="defaultOpen">
    <summary class="collapsible-panel__summary">
      <span class="collapsible-panel__main">
        <span class="collapsible-panel__title">{{ title }}</span>
        <span v-if="subtitle" class="collapsible-panel__subtitle">{{ subtitle }}</span>
      </span>
      <span v-if="badge" class="status-badge" :data-state="badgeState">{{ badge }}</span>
    </summary>
    <div class="collapsible-panel__body">
      <slot />
    </div>
  </details>
</template>
