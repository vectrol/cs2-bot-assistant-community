import type { RouteRecordRaw } from 'vue-router'

export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/install',
  },
  {
    path: '/install',
    name: 'install',
    component: () => import('@/views/InstallView.vue'),
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
    path: '/player-cosmetics',
    name: 'player-cosmetics',
    component: () => import('@/views/PlayerCosmeticsView.vue'),
  },
  {
    path: '/commands',
    name: 'commands',
    component: () => import('@/views/CommandsView.vue'),
  },
  {
    path: '/custom-commands',
    name: 'custom-commands',
    component: () => import('@/views/CustomCommandsView.vue'),
  },
  {
    path: '/settings',
    name: 'settings',
    component: () => import('@/views/SettingsView.vue'),
  },
  {
    path: '/official-site',
    name: 'official-site',
    component: () => import('@/views/OfficialSiteView.vue'),
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
]
