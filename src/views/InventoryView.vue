<script setup lang="ts">
import { inject } from 'vue'
import { useI18n } from 'vue-i18n'

import { openInventoryWindow } from '@/services/tauri/app'

const { t } = useI18n()
const openLaunchModal = inject<() => void>('openLaunchGameModal')

const icons: Record<string, string> = {
  skin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v12M6 12h12"/></svg>',
  case: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><circle cx="12" cy="12" r="3"/></svg>',
  sticker: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 12a8 8 0 11-8-8"/><path d="M20 12a8 8 0 01-8 8"/><path d="M20 12h-8V4"/></svg>',
  rename: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M17 3a2.85 2.85 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>',
  sync: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M1 12s2-6 8-6c4 0 6 3 8 3"/><path d="M23 12s-2 6-8 6c-4 0-6-3-8-3"/><path d="M13 2l3 3-3 3M11 22l-3-3 3-3"/></svg>',
  manage: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16v16H4z"/><path d="M4 9h16M9 4v16"/></svg>',
}

const features = [
  { icon: 'skin', titleKey: 'inventory.features.skin.title', descKey: 'inventory.features.skin.desc' },
  { icon: 'case', titleKey: 'inventory.features.case.title', descKey: 'inventory.features.case.desc' },
  { icon: 'sticker', titleKey: 'inventory.features.sticker.title', descKey: 'inventory.features.sticker.desc' },
  { icon: 'rename', titleKey: 'inventory.features.rename.title', descKey: 'inventory.features.rename.desc' },
  { icon: 'sync', titleKey: 'inventory.features.sync.title', descKey: 'inventory.features.sync.desc' },
  { icon: 'manage', titleKey: 'inventory.features.manage.title', descKey: 'inventory.features.manage.desc' },
]

const configItems = [
  { key: 'invsim_url', descKey: 'inventory.configItems.url' },
  { key: 'invsim_apikey', descKey: 'inventory.configItems.apikey' },
  { key: 'invsim_ws_enabled', descKey: 'inventory.configItems.wsEnabled' },
  { key: 'invsim_ws_cooldown', descKey: 'inventory.configItems.wsCooldown' },
]

function getIcon(name: string): string {
  return icons[name] || ''
}
</script>

<template>
  <section class="page-grid inventory-page">
    <article class="hero-banner inventory-hero glass stagger-enter" style="animation: fade-in-up 0.25s ease;">
      <div>
        <p class="eyebrow">{{ t('nav.inventory') }}</p>
        <h2>{{ t('inventory.simulatorTitle') }}</h2>
        <p class="muted">{{ t('inventory.hint') }}</p>
      </div>
      <div class="inventory-hero__actions">
        <button class="primary-button" type="button" @click="openInventoryWindow()">
          {{ t('inventory.openSimulator') }}
        </button>
        <button class="ghost-button" type="button" @click="openLaunchModal?.()">
          {{ t('inventory.openCs2') }}
        </button>
      </div>
    </article>

    <div class="inventory-features stagger-enter">
      <article
        v-for="f in features"
        :key="f.titleKey"
        class="feature-card glass"
      >
        <span class="feature-card__icon" v-html="getIcon(f.icon)" />
        <h3>{{ t(f.titleKey) }}</h3>
        <p class="muted">{{ t(f.descKey) }}</p>
      </article>
    </div>

    <article class="card inventory-config glass">
      <div class="section-head">
        <div>
          <p class="eyebrow">{{ t('inventory.configSection') }}</p>
          <h3>{{ t('inventory.configTitle') }}</h3>
        </div>
      </div>
      <div class="config-grid">
        <div v-for="item in configItems" :key="item.key" class="config-row glass">
          <code>{{ item.key }}</code>
          <span class="muted">{{ t(item.descKey) }}</span>
        </div>
      </div>
      <p class="muted config-note">
        {{ t('inventory.configNote') }}
      </p>
    </article>
  </section>
</template>

<style scoped>
.inventory-page {
  padding: 1rem;
}

.inventory-hero {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 1rem;
}

.inventory-hero__actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.inventory-features {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 0.75rem;
  margin: 1.5rem 0;
}

.feature-card {
  padding: 1.25rem 1rem;
  text-align: center;
  border-radius: var(--radius-md);
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.feature-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--glass-shadow);
  border-color: var(--accent);
}

.feature-card__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  margin: 0 auto 0.75rem;
  color: var(--accent);
}

.feature-card__icon :deep(svg) {
  width: 28px;
  height: 28px;
}

.feature-card h3 {
  margin: 0 0 0.25rem;
  font-size: var(--fs-sm);
}

.inventory-config {
  margin-top: 0.5rem;
  padding: 1.25rem;
  border-radius: var(--radius-lg);
}

.config-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 0.5rem;
  margin: 0.75rem 0;
}

.config-row {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  padding: 0.5rem 0.75rem;
  border-radius: var(--radius-sm);
  font-size: var(--fs-sm);
}

.config-row code {
  font-family: var(--font-mono);
  color: var(--accent-text, var(--accent));
}

.config-note {
  font-size: var(--fs-xs);
  margin-top: 0.75rem;
}

.config-note code {
  font-family: var(--font-mono);
  font-size: var(--fs-xs);
}

@media (prefers-reduced-motion: reduce) {
  .feature-card {
    transition: none;
  }
  .feature-card:hover {
    transform: none;
  }
}
</style>
