export interface SoftwareReleaseDownload {
  type: 'quark' | string
  label: string
  url: string
  code?: string
}

export interface SoftwareRelease {
  id?: string
  projectId: string
  channel: string
  version: string
  title: string
  summary: string
  items: string[]
  severity: 'normal' | 'recommended' | 'critical'
  isCritical?: boolean
  isActive?: boolean
  publishedAt: string
  download: SoftwareReleaseDownload
}

export interface SoftwareUpdatePayload {
  projectId: string
  channel: string
  currentVersion: string
  hasUpdate: boolean
  latest: SoftwareRelease | null
  history: SoftwareRelease[]
}
