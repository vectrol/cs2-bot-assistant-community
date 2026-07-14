import { invoke } from '@tauri-apps/api/core'

export interface OfficialSiteBounds {
  x: number
  y: number
  width: number
  height: number
}

export function showOfficialSite(url: string, bounds: OfficialSiteBounds) {
  return invoke<string>('official_site_show', {
    url,
    ...bounds,
  })
}

export function navigateOfficialSite(url: string) {
  return invoke<string>('official_site_navigate', { url })
}

export function setOfficialSiteBounds(bounds: OfficialSiteBounds) {
  return invoke<void>('official_site_set_bounds', {
    ...bounds,
  })
}

export function hideOfficialSite() {
  return invoke<void>('official_site_hide')
}

export function reloadOfficialSite() {
  return invoke<void>('official_site_reload')
}

export function goBackOfficialSite() {
  return invoke<void>('official_site_go_back')
}

export function goForwardOfficialSite() {
  return invoke<void>('official_site_go_forward')
}
