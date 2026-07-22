<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { listPlugins, togglePlugin } from '@/services/tauri/cs2'
import { useCs2Store } from '@/stores/cs2'
import type { PluginInfo } from '@/types/cs2'

const { t } = useI18n()
const store = useCs2Store()
const plugins = ref<PluginInfo[]>([])
const loading = ref(false)
const toggling = ref<string | null>(null)

const installedCount = computed(() => plugins.value.filter(p => p.enabled).length)
const totalCount = computed(() => plugins.value.length)

async function load() {
  if (!store.selectedRoot) return
  loading.value = true
  try {
    plugins.value = await listPlugins(store.selectedRoot)
  } finally {
    loading.value = false
  }
}

async function toggle(p: PluginInfo) {
  toggling.value = p.name
  try {
    const updated = await togglePlugin(store.selectedRoot, p.name)
    if (updated) {
      const idx = plugins.value.findIndex(x => x.name === p.name)
      if (idx >= 0) plugins.value[idx] = updated
    }
  } finally {
    toggling.value = null
  }
}

onMounted(load)
</script>

<template>
  <section class="page-grid plugins-page">
    <article class="hero-banner plugins-hero glass stagger-enter" style="animation: fade-in-up 0.25s ease;">
      <div>
        <p class="eyebrow">{{ t('plugins.title') }}</p>
        <h2>{{ t('plugins.pageTitle') }}</h2>
        <p class="muted">
          {{ t('plugins.count', { enabled: installedCount, total: totalCount }) }}
        </p>
      </div>
      <div class="plugins-hero__actions">
        <button class="ghost-button" type="button" :disabled="loading" @click="load">
           {{ t('plugins.refresh') }}
        </button>
      </div>
    </article>

    <div v-if="loading" class="plugins-grid">
      <div v-for="i in 6" :key="i" class="plugin-card glass">
        <div class="skeleton-line" style="width:60%;height:1rem" />
        <div class="skeleton-line" style="width:40%;height:.75rem;margin-top:.5rem" />
      </div>
    </div>

    <div v-else-if="plugins.length === 0" class="plugins-empty glass">
      <p class="muted">{{ t('plugins.empty') }}</p>
    </div>

    <div v-else class="plugins-grid stagger-enter">
      <article
        v-for="p in plugins"
        :key="p.name"
        class="plugin-card glass"
        :class="{ 'plugin-card--disabled': !p.enabled }"
      >
        <div class="plugin-card__top">
          <div class="plugin-card__info">
            <h3>{{ p.name }}</h3>
            <span v-if="p.version" class="plugin-card__version">{{ p.version }}</span>
            <span v-else class="plugin-card__version muted">{{ t('plugins.unknownVersion') }}</span>
          </div>
          <label class="plugin-toggle" :class="{ toggling: toggling === p.name }">
            <input
              type="checkbox"
              :checked="p.enabled"
              :disabled="toggling === p.name"
              @change="toggle(p)"
            />
            <span class="plugin-toggle__slider" />
          </label>
        </div>
        <div class="plugin-card__meta">
          <span class="status-pill" :data-state="p.enabled ? 'ready' : 'warn'">
            {{ p.enabled ? t('plugins.enabled') : t('plugins.disabled') }}
          </span>
          <span v-if="p.hasConfig" class="status-pill" data-state="info">
            {{ t('plugins.hasConfig') }}
          </span>
        </div>
      </article>
    </div>
  </section>
</template>

<style scoped>
.plugins-page {
  padding: 1rem;
}

.plugins-hero {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 1rem;
}

.plugins-hero__actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.plugins-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 0.75rem;
  margin-top: 1.5rem;
}

.plugin-card {
  padding: 1rem 1.25rem;
  border-radius: var(--radius-md);
  border-left: 3px solid var(--accent);
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.plugin-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--glass-shadow);
}

.plugin-card--disabled {
  border-left-color: var(--text-muted);
  opacity: 0.7;
}

.plugin-card--disabled:hover {
  opacity: 0.9;
}

.plugin-card__top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.75rem;
}

.plugin-card__info h3 {
  margin: 0;
  font-size: var(--fs-base);
}

.plugin-card__version {
  font-size: var(--fs-xs);
  font-family: var(--font-mono);
  color: var(--accent);
}

.plugin-card__meta {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.75rem;
}

.plugin-toggle {
  position: relative;
  display: inline-flex;
  width: 36px;
  height: 20px;
  flex-shrink: 0;
  cursor: pointer;
}

.plugin-toggle input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.plugin-toggle__slider {
  position: absolute;
  inset: 0;
  background: var(--ghost-bg);
  border-radius: 10px;
  transition: background 0.2s;
}

.plugin-toggle__slider::before {
  content: '';
  position: absolute;
  width: 16px;
  height: 16px;
  left: 2px;
  bottom: 2px;
  background: var(--text-muted);
  border-radius: 50%;
  transition: transform 0.2s, background 0.2s;
}

.plugin-toggle input:checked + .plugin-toggle__slider {
  background: var(--accent);
}

.plugin-toggle input:checked + .plugin-toggle__slider::before {
  transform: translateX(16px);
  background: #fff;
}

.plugin-toggle.toggling {
  opacity: 0.6;
  pointer-events: none;
}

.plugins-empty {
  margin-top: 1.5rem;
  padding: 2rem;
  text-align: center;
  border-radius: var(--radius-md);
}

@media (prefers-reduced-motion: reduce) {
  .plugin-card {
    transition: none;
  }
  .plugin-card:hover {
    transform: none;
  }
}
</style>
