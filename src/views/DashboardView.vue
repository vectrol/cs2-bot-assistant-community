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

const icons: Record<string, string> = {
  play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>',
  grid: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><rect x="3" y="3" width="8" height="8" rx="1"/><rect x="13" y="3" width="8" height="8" rx="1"/><rect x="3" y="13" width="8" height="8" rx="1"/><rect x="13" y="13" width="8" height="8" rx="1"/></svg>',
  terminal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 17l6-6-6-6"/><path d="M12 19h8"/></svg>',
  gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M1 12h2M21 12h2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke-linecap="round"/></svg>',
  help: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" stroke-linecap="round"/><circle cx="12" cy="17" r=".5" fill="currentColor"/></svg>',
  sliders: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><circle cx="4" cy="12" r="2"/><circle cx="12" cy="10" r="2"/><circle cx="20" cy="14" r="2"/></svg>',
  plugins: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M4 6h3M4 12h3M4 18h3"/><rect x="7" y="4" width="13" height="16" rx="2"/><path d="M12 10h5M12 14h5"/></svg>',
  folder: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M2 6a2 2 0 012-2h5l2 2h9a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="10"/></svg>',
  file: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/></svg>',
}

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
    title: t('nav.configConsole'),
    desc: t('config.nadeRecovery'),
    icon: 'gear',
    to: '/config',
    color: '#f59e0b',
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
    title: t('nav.projects'),
    desc: t('workspace.projects.title'),
    icon: 'folder',
    to: '/projects',
    color: '#14b8a6',
  },
  {
    title: t('nav.tasks'),
    desc: t('workspace.tasks.title'),
    icon: 'check',
    to: '/tasks',
    color: '#f97316',
  },
  {
    title: t('nav.logs'),
    desc: t('workspace.logs.title'),
    icon: 'file',
    to: '/logs',
    color: '#6366f1',
  },
])

const envStatus = computed<Cs2EnvironmentStatus | null>(() => store.environment)

const statusItems = computed(() => [
  { label: t('app.cs2Running'), value: store.cs2Running ? t('status.cs2Running') : t('status.cs2NotRunning'), state: store.cs2Running ? 'warn' as const : 'ready' as const },
  { label: t('quickControl.gameMode'), value: envStatus.value?.activeGameMode === 'withBots' ? t('quickControl.botMode') : t('quickControl.onlineMode'), state: 'info' as const },
  { label: t('guide.environmentTitle'), value: envStatus.value ? (envStatus.value.baseEnvironmentReady ? t('guide.environmentReady') : t('guide.environmentIncomplete')) : t('guide.notChecked'), state: envStatus.value?.baseEnvironmentReady ? 'ready' as const : 'warn' as const },
])

function getIcon(name: string): string {
  return icons[name] || ''
}
</script>

<template>
  <section class="page-grid dashboard-page">
    <article class="hero-banner dashboard-hero glass stagger-enter" style="animation: fade-in-up 0.25s ease;">
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
