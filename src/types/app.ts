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
