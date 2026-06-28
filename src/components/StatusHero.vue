<script setup lang="ts">
withDefaults(
  defineProps<{
    eyebrow: string
    title: string
    description?: string
    badges?: Array<{
      label: string
      state?: 'ready' | 'warn' | 'danger' | 'info'
    }>
  }>(),
  {
    description: '',
    badges: () => [],
  },
)
</script>

<template>
  <article class="hero-banner status-hero">
    <div class="status-hero__copy">
      <p class="eyebrow">{{ eyebrow }}</p>
      <h2>{{ title }}</h2>
      <p v-if="description" class="muted">{{ description }}</p>
    </div>

    <div class="hero-status status-hero__actions">
      <div v-if="badges.length > 0" class="status-hero__badges">
        <span
          v-for="badge in badges"
          :key="badge.label"
          class="status-badge"
          :data-state="badge.state ?? 'info'"
        >
          {{ badge.label }}
        </span>
      </div>
      <slot name="actions" />
    </div>
  </article>
</template>
