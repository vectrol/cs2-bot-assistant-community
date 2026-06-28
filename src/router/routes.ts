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
    path: '/major',
    name: 'major',
    component: () => import('@/views/MajorView.vue'),
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
