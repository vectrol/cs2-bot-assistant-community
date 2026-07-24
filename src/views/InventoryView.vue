<script setup lang="ts">
import { useI18n } from 'vue-i18n'

import { openInventoryWindow } from '@/services/tauri/app'

const { t } = useI18n()
</script>

<template>
  <section class="page-grid inventory-page">
    <article class="hero-banner inventory-hero glass">
      <div>
        <p class="eyebrow">{{ t('nav.inventory') }}</p>
        <h2>{{ t('inventory.simulatorTitle') }}</h2>
        <p class="muted">{{ t('inventory.hint') }}</p>
      </div>
      <div class="inventory-hero__actions">
        <button class="primary-button" type="button" @click="openInventoryWindow()">
          {{ t('inventory.openSimulator') }}
        </button>
      </div>
    </article>

    <article class="card inventory-config glass">
      <div class="section-head">
        <div>
          <p class="eyebrow">{{ t('inventory.configSection') }}</p>
          <h3>{{ t('inventory.configTitle') }}</h3>
        </div>
      </div>
      <p class="muted config-note">{{ t('inventory.configNote') }}</p>
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

.inventory-config {
  margin-top: 1rem;
  padding: 1.25rem;
  border-radius: var(--radius-lg);
}

.config-note {
  font-size: var(--fs-xs);
  margin-top: 0.75rem;
}
</style>