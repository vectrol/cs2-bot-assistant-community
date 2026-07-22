<script setup lang="ts">
import { computed, inject } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'

import { appConfig } from '@/config/app'
import { useCs2Store } from '@/stores/cs2'
import type { Cs2EnvironmentStatus } from '@/types/cs2'

const { t } = useI18n()
const store = useCs2Store()
const openLaunchModal = inject<() => void>('openLaunchGameModal')

const cards = computed(() => [
  {
    title: t('nav.quickControl'),
    desc: t('quickControl.oneClickFlow'),
    icon: '⚡',
    to: '/quick-control',
    color: 'var(--accent)',
    actions: openLaunchModal ? [
      { label: t('app.openCs2'), action: openLaunchModal, primary: true },
    ] : undefined,
  },
  {
    title: t('nav.inventory'),
    desc: t('inventory.hint'),
    icon: '🎒',
    to: '/inventory',
    color: '#a855f7',
  },
  {
    title: t('nav.commands'),
    desc: t('commands.title'),
    icon: '⌨',
    to: '/commands',
    color: '#22c55e',
  },
  {
    title: t('nav.configConsole'),
    desc: t('config.nadeRecovery'),
    icon: '⚙',
    to: '/config',
    color: '#f59e0b',
  },
  {
    title: t('nav.guideHelp'),
    desc: t('guide.environmentTitle'),
    icon: '📖',
    to: '/guide',
    color: '#06b6d4',
  },
  {
    title: t('nav.settings'),
    desc: t('settings.appearance'),
    icon: '🎨',
    to: '/settings',
    color: '#ec4899',
  },
])

const envStatus = computed<Cs2EnvironmentStatus | null>(() => store.environment)

const statusItems = computed(() => [
  { label: t('app.cs2Running'), value: store.cs2Running ? t('status.cs2Running') : t('status.cs2NotRunning'), state: store.cs2Running ? 'warn' as const : 'ready' as const },
  { label: t('quickControl.gameMode'), value: envStatus.value?.activeGameMode === 'withBots' ? t('quickControl.botMode') : t('quickControl.onlineMode'), state: 'info' as const },
  { label: t('guide.environmentTitle'), value: envStatus.value ? (envStatus.value.baseEnvironmentReady ? t('guide.environmentReady') : t('guide.environmentIncomplete')) : t('guide.notChecked'), state: envStatus.value?.baseEnvironmentReady ? 'ready' as const : 'warn' as const },
])
</script>

<template>
  <section class="page-grid dashboard-page">
    <article class="hero-banner dashboard-hero">
      <div>
        <p class="eyebrow">{{ t('app.brandLabel') }}</p>
        <h2>{{ t('app.name') }}</h2>
        <p class="muted">{{ t('app.version') }} {{ appConfig.appVersion }}</p>
      </div>
      <div class="dashboard-hero__status">
        <span
          v-for="item in statusItems"
          :key="item.label"
          class="status-pill"
          :data-state="item.state"
        >
          {{ item.label }}: {{ item.value }}
        </span>
      </div>
    </article>

    <div class="dashboard-grid">
      <article
        v-for="card in cards"
        :key="card.title"
        class="dashboard-card"
        :style="{ '--card-color': card.color }"
      >
        <div class="dashboard-card__header">
          <span class="dashboard-card__icon">{{ card.icon }}</span>
          <div>
            <h3>{{ card.title }}</h3>
            <p class="muted">{{ card.desc }}</p>
          </div>
        </div>
        <div class="dashboard-card__actions">
          <RouterLink class="ghost-button" :to="card.to">
            进入
          </RouterLink>
          <button
            v-if="card.actions"
            v-for="action in card.actions"
            :key="action.label"
            :class="action.primary ? 'primary-button' : 'ghost-button'"
            type="button"
            @click="action.action"
          >
            {{ action.label }}
          </button>
        </div>
      </article>
    </div>
  </section>
</template>

<style scoped>
.dashboard-page {
  padding: 1rem;
}

.dashboard-hero {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 1rem;
}

.dashboard-hero__status {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
  margin-top: 1.5rem;
}

.dashboard-card {
  background: var(--panel-bg);
  border: 1px solid var(--panel-border);
  border-radius: var(--radius-lg);
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  transition: box-shadow 0.2s, border-color 0.2s;
  border-left: 3px solid var(--card-color);
}

.dashboard-card:hover {
  box-shadow: var(--elevation-2);
  border-color: var(--card-color);
}

.dashboard-card__header {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.dashboard-card__icon {
  font-size: 1.75rem;
  line-height: 1;
  flex-shrink: 0;
  margin-top: 0.1rem;
}

.dashboard-card__header h3 {
  margin: 0;
  font-size: var(--fs-lg);
}

.dashboard-card__actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}
</style>
