import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import registry from '@/config/workspace/projects.json'
import type { NavItem, ProjectProfile, WorkQueueItem, WorkspaceRegistry } from '@/types/app'

const navItems: NavItem[] = [
  { label: 'Dashboard', to: '/', description: 'Workspace runtime and isolation status overview' },
  { label: 'Projects', to: '/projects', description: 'Project registry and path isolation relationships' },
  { label: 'Tasks', to: '/tasks', description: 'Active project execution queue' },
  { label: 'Logs', to: '/logs', description: 'Project diagnostics and command output' },
  { label: 'Settings', to: '/settings', description: 'Workspace and environment controls' },
]

const seedQueue: WorkQueueItem[] = [
  {
    id: 'cs2-installer-hardening',
    title: 'Verify CS2 bot install and config pipeline',
    status: 'done',
    owner: 'codex',
    projectId: 'cs2-bot-improver',
  },
  {
    id: 'cs2-release-notes',
    title: 'Keep in-app changelog in sync with package version',
    status: 'done',
    owner: 'manual',
    projectId: 'cs2-bot-improver',
  },
  {
    id: 'cs2-workspace-guardrails',
    title: 'Validate CS2 workspace path isolation before build',
    status: 'done',
    owner: 'codex',
    projectId: 'cs2-bot-improver',
  },
]

const workspaceRegistry = registry as WorkspaceRegistry

export const useWorkspaceStore = defineStore('workspace', () => {
  const appName = ref(import.meta.env.VITE_APP_NAME)
  const workspaceName = ref(import.meta.env.VITE_WORKSPACE_NAME)
  const channel = ref(import.meta.env.VITE_APP_CHANNEL)
  const projects = ref<ProjectProfile[]>(workspaceRegistry.projects)
  const queue = ref(seedQueue)
  const activeProjectId = ref(import.meta.env.VITE_DEFAULT_PROJECT_ID)

  const activeProject = computed(
    () => projects.value.find((project) => project.id === activeProjectId.value) ?? projects.value[0],
  )
  const openCount = computed(() => queue.value.filter((item) => item.status !== 'done').length)
  const activeProjectCount = computed(
    () => projects.value.filter((project) => project.status === 'active').length,
  )

  function setActiveProject(projectId: string) {
    if (projects.value.some((project) => project.id === projectId)) {
      activeProjectId.value = projectId
    }
  }

  function queueForProject(projectId: string) {
    return queue.value.filter((item) => item.projectId === projectId)
  }

  return {
    appName,
    workspaceName,
    channel,
    navItems,
    projects,
    queue,
    activeProject,
    activeProjectId,
    activeProjectCount,
    openCount,
    workspaceRegistry,
    queueForProject,
    setActiveProject,
  }
})
