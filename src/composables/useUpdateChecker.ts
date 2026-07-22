import { ref } from 'vue'

import { appConfig } from '@/config/app'

const GITHUB_API = 'https://api.github.com/repos/vectrol/cs2-bot-assistant-community/releases/latest'
const UPSTREAM_API = 'https://api.github.com/repos/ed0ard/CS2-Bot-Improver/releases/latest'
const CHECK_STORAGE_KEY = 'cs2-update-last-check'
const RESOURCE_CHECK_KEY = 'cs2-resource-last-check'
const DISMISS_STORAGE_KEY = 'cs2-update-dismissed'
const CURRENT_RESOURCE_VERSION = '1.4.2'

export interface UpdateInfo {
  latestVersion: string
  currentVersion: string
  htmlUrl: string
  title: string
  body: string
  publishedAt: string
  downloadUrl: string | null
}

export interface ResourceUpdateInfo {
  upstreamVersion: string
  currentVersion: string
  htmlUrl: string
  title: string
  publishedAt: string
}

export function useUpdateChecker() {
  const updateInfo = ref<UpdateInfo | null>(null)
  const resourceInfo = ref<ResourceUpdateInfo | null>(null)
  const checking = ref(false)
  const error = ref<string | null>(null)

  function parseTag(tag: string): string {
    return tag.replace(/^v/, '')
  }

  function isNewer(latest: string, current: string): boolean {
    const la = latest.split('.').map(Number)
    const ca = current.split('.').map(Number)
    for (let i = 0; i < Math.max(la.length, ca.length); i++) {
      const l = la[i] ?? 0
      const c = ca[i] ?? 0
      if (l > c) return true
      if (l < c) return false
    }
    return false
  }

  function wasRecentlyChecked(): boolean {
    if (typeof window === 'undefined') return true
    const last = window.localStorage.getItem(CHECK_STORAGE_KEY)
    if (!last) return false
    const elapsed = Date.now() - Number(last)
    return elapsed < 3600000
  }

  function markChecked() {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(CHECK_STORAGE_KEY, String(Date.now()))
    }
  }

  function isDismissed(version: string): boolean {
    if (typeof window === 'undefined') return true
    return window.localStorage.getItem(DISMISS_STORAGE_KEY) === version
  }

  function dismissVersion(version: string) {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(DISMISS_STORAGE_KEY, version)
    }
  }

  async function checkForUpdates(force = false): Promise<UpdateInfo | null> {
    if (!force && wasRecentlyChecked()) return null

    checking.value = true
    error.value = null

    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 8000)

      const res = await fetch(GITHUB_API, {
        headers: { Accept: 'application/vnd.github.v3+json', 'User-Agent': 'cs2-bot-assistant-ce' },
        signal: controller.signal,
      })
      clearTimeout(timeout)

      if (!res.ok) {
        throw new Error(`GitHub API responded with ${res.status}`)
      }

      const data = await res.json()
      const latestTag: string = data.tag_name || data.name || ''
      const latestVersion = parseTag(latestTag)
      const currentVersion = appConfig.appVersion

      if (!latestVersion || !isNewer(latestVersion, currentVersion)) {
        markChecked()
        return null
      }

      const info: UpdateInfo = {
        latestVersion,
        currentVersion,
        htmlUrl: data.html_url || '',
        title: data.name || data.tag_name || latestVersion,
        body: data.body || '',
        publishedAt: data.published_at || '',
        downloadUrl: null,
      }

      if (data.assets && data.assets.length > 0) {
        const installer = data.assets.find(
          (a: { name: string }) => a.name.includes('setup') || a.name.endsWith('.exe'),
        )
        if (installer) {
          info.downloadUrl = installer.browser_download_url
        }
      }

      updateInfo.value = info
      markChecked()
      return info
    } catch (err) {
      error.value = err instanceof Error ? err.message : String(err)
      return null
    } finally {
      checking.value = false
    }
  }

  function wasResourceRecentlyChecked(): boolean {
    if (typeof window === 'undefined') return true
    const last = window.localStorage.getItem(RESOURCE_CHECK_KEY)
    if (!last) return false
    return Date.now() - Number(last) < 86400000
  }

  function markResourceChecked() {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(RESOURCE_CHECK_KEY, String(Date.now()))
    }
  }

  async function checkResourceUpdates(force = false): Promise<ResourceUpdateInfo | null> {
    if (!force && wasResourceRecentlyChecked()) return null

    checking.value = true
    error.value = null

    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 8000)

      const res = await fetch(UPSTREAM_API, {
        headers: { Accept: 'application/vnd.github.v3+json', 'User-Agent': 'cs2-bot-assistant-ce' },
        signal: controller.signal,
      })
      clearTimeout(timeout)

      if (!res.ok) throw new Error(`Upstream API responded with ${res.status}`)

      const data = await res.json()
      const upstreamTag: string = data.tag_name || data.name || ''
      const upstreamVersion = parseTag(upstreamTag)

      if (!upstreamVersion || !isNewer(upstreamVersion, CURRENT_RESOURCE_VERSION)) {
        markResourceChecked()
        return null
      }

      const info: ResourceUpdateInfo = {
        upstreamVersion,
        currentVersion: CURRENT_RESOURCE_VERSION,
        htmlUrl: data.html_url || '',
        title: data.name || data.tag_name || upstreamVersion,
        publishedAt: data.published_at || '',
      }

      resourceInfo.value = info
      markResourceChecked()
      return info
    } catch (err) {
      error.value = err instanceof Error ? err.message : String(err)
      return null
    } finally {
      checking.value = false
    }
  }

  return {
    updateInfo,
    resourceInfo,
    checking,
    error,
    checkForUpdates,
    checkResourceUpdates,
    isDismissed,
    dismissVersion,
    CURRENT_RESOURCE_VERSION,
  }
}
