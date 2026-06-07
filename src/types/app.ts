export interface DesktopRuntimeContext {
  appName: string
  appVersion: string
  rustCrate: string
  target: string
  profile: string
}

export interface NavItem {
  label: string
  to: string
  description: string
}

export interface WorkQueueItem {
  id: string
  title: string
  status: 'queued' | 'running' | 'blocked' | 'done'
  owner: string
  projectId: string
}

export interface ProjectProfile {
  id: string
  name: string
  status: 'active' | 'planned' | 'paused'
  channel: string
  rootDir: string
  envFile: string
  tauriConfig: string
  distDir: string
  bundleDir: string
  logDir: string
  description: string
}

export interface WorkspaceRegistry {
  version: number
  workspace: {
    name: string
    rootDir: string
    runtimeDir: string
  }
  projects: ProjectProfile[]
}
