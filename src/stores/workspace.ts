import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import registry from '@/config/workspace/projects.json'
import type { NavItem, ProjectProfile, WorkQueueItem, WorkspaceRegistry } from '@/types/app'

const navItems: NavItem[] = [
  { label: '仪表盘', to: '/', description: '工作区运行时和隔离状态概览' },
  { label: '项目', to: '/projects', description: '项目注册表和路径隔离关系' },
  { label: '任务', to: '/tasks', description: '活跃项目的执行队列' },
  { label: '日志', to: '/logs', description: '项目诊断和命令输出' },
  { label: '设置', to: '/settings', description: '工作区和环境控制' },
]

const seedQueue: WorkQueueItem[] = [
  {
    id: 'cs2-installer-hardening',
    title: '验证 CS2 Bot 安装和配置流程',
    status: 'done',
    owner: 'codex',
    projectId: 'cs2-bot-improver',
  },
  {
    id: 'cs2-release-notes',
    title: '保持应用内更新日志与打包版本一致',
    status: 'done',
    owner: '人工',
    projectId: 'cs2-bot-improver',
  },
  {
    id: 'cs2-workspace-guardrails',
    title: '构建前验证 CS2 工作区路径隔离',
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
