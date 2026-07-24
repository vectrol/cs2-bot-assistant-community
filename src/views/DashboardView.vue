<script setup lang="ts">
import { computed, inject } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'

import { appConfig } from '@/config/app'
import { getIcon } from '@/constants/icons'
import { useCs2Store } from '@/stores/cs2'
import type { Cs2EnvironmentStatus } from '@/types/cs2'

const { t } = useI18n()
const store = useCs2Store()
const openLaunchModal = inject<() => void>('openLaunchGameModal')

const cards = computed(() => [
  {
    title: t('nav.quickControl'),
    desc: t('quickControl.oneClickFlow'),
    icon: 'play',
    to: '/quick-control',
    color: 'var(--accent)',
    actions: openLaunchModal ? [
      { label: t('app.openCs2'), action: openLaunchModal, primary: true },
    ] : undefined,
  },
  {
    title: t('nav.inventory'),
    desc: t('inventory.hint'),
    icon: 'grid',
    to: '/inventory',
    color: '#a855f7',
  },
  {
    title: t('nav.commands'),
    desc: t('commands.title'),
    icon: 'terminal',
    to: '/commands',
    color: '#22c55e',
  },
  {
    title: t('nav.guideHelp'),
    desc: t('guide.environmentTitle'),
    icon: 'help',
    to: '/guide',
    color: '#06b6d4',
  },
  {
    title: t('nav.settings'),
    desc: t('settings.appearance'),
    icon: 'sliders',
    to: '/settings',
    color: '#ec4899',
  },
  {
    title: t('nav.plugins'),
    desc: t('plugins.title'),
    icon: 'plugins',
    to: '/plugins',
    color: '#8b5cf6',
  },
  {
    title: t('nav.matchHistory'),
    desc: t('matchHistory.dashboardDesc'),
    icon: 'history',
    to: '/match-history',
    color: '#14b8a6',
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
    <article class="hero-banner dashboard-hero glass">
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

    <div class="dashboard-grid stagger-enter">
      <article
        v-for="card in cards"
        :key="card.title"
        class="dashboard-card glass"
        :style="{ '--card-color': card.color }"
      >
        <div class="dashboard-card__header">
          <span class="dashboard-card__icon" v-html="getIcon(card.icon)" />
          <div>
            <h3>{{ card.title }}</h3>
            <p class="muted">{{ card.desc }}</p>
          </div>
        </div>
        <div class="dashboard-card__actions">
          <RouterLink class="ghost-button" :to="card.to">
            {{ t('app.enter') }}
          </RouterLink>
          <template v-if="card.actions">
            <button
              v-for="action in card.actions"
              :key="action.label"
              :class="action.primary ? 'primary-button' : 'ghost-button'"
              type="button"
              @click="action.action"
            >
              {{ action.label }}
            </button>
          </template>
        </div>
      </article>
    </div>
  </section>
</template>

<style scoped>
.dashboard-page {
  padding: 1rem;
  animation: fade-in-up 0.35s var(--ease-out) both;
  animation-duration: calc(0.35s * var(--anim-speed, 1));
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
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
  border-left: 3px solid var(--card-color);
  border-radius: var(--radius-lg);
}

.dashboard-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--glass-shadow);
  border-color: var(--card-color);
}

.dashboard-card__header {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.dashboard-card__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  color: var(--card-color);
}

.dashboard-card__icon :deep(svg) {
  width: 28px;
  height: 28px;
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

@media (prefers-reduced-motion: reduce) {
  .dashboard-card {
    transition: none;
  }
  .dashboard-card:hover {
    transform: none;
  }
}
</style>
