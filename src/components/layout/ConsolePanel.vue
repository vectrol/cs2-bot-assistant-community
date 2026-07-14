<script setup lang="ts">
withDefaults(
  defineProps<{
    eyebrow?: string
    title: string
    description?: string
    tone?: 'default' | 'strong'
  }>(),
  {
    eyebrow: '',
    description: '',
    tone: 'default',
  },
)
</script>

<template>
  <article class="console-panel" :data-tone="tone">
    <header class="console-panel__head">
      <div>
        <p v-if="eyebrow" class="eyebrow">{{ eyebrow }}</p>
        <h3>{{ title }}</h3>
        <p v-if="description" class="muted">{{ description }}</p>
      </div>
      <div v-if="$slots.actions" class="console-panel__actions">
        <slot name="actions" />
      </div>
    </header>
    <slot />
  </article>
</template>
