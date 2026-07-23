import type { RouteRecordRaw } from 'vue-router'

export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'dashboard',
    component: () => import('@/views/DashboardView.vue'),
  },
  {
    path: '/config',
    name: 'config',
    component: () => import('@/views/ConfigView.vue'),
  },
  {
    path: '/quick-control',
    name: 'quick-control',
    component: () => import('@/views/QuickControlView.vue'),
  },
  {
    path: '/inventory',
    name: 'inventory',
    component: () => import('@/views/InventoryView.vue'),
  },
  {
    path: '/commands',
    name: 'commands',
    component: () => import('@/views/CommandsView.vue'),
  },
  {
    path: '/settings',
    name: 'settings',
    component: () => import('@/views/SettingsView.vue'),
  },
  {
    path: '/guide',
    name: 'guide',
    component: () => import('@/views/GuideView.vue'),
  },
  {
    path: '/release-notes',
    name: 'release-notes',
    component: () => import('@/views/ReleaseNotesView.vue'),
  },
  {
    path: '/plugins',
    name: 'plugins',
    component: () => import('@/views/PluginsView.vue'),
  },
  {
    path: '/news',
    name: 'news',
    component: () => import('@/views/NewsView.vue'),
  },
  {
    path: '/match-history',
    name: 'match-history',
    component: () => import('@/views/MatchHistoryView.vue'),
  },
  {
    path: '/match-history/:index',
    name: 'match-detail',
    component: () => import('@/views/MatchDetailView.vue'),
  },
]
