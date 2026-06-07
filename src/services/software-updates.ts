import { appConfig } from '@/config/app'
import type { SoftwareUpdatePayload } from '@/features/software-updates/types'

const UPDATE_CHECK_TIMEOUT_MS = 6000

export async function fetchSoftwareUpdates() {
  if (!appConfig.updaterEnabled || !appConfig.updateFeedUrl) {
    return null
  }

  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), UPDATE_CHECK_TIMEOUT_MS)

  try {
    const url = new URL(appConfig.updateFeedUrl)
    url.searchParams.set('currentVersion', appConfig.appVersion)
    if (!url.searchParams.has('channel')) {
      url.searchParams.set('channel', appConfig.channel)
    }

    const response = await fetch(url.toString(), {
      cache: 'no-store',
      signal: controller.signal,
    })

    if (!response.ok) {
      return null
    }

    return (await response.json()) as SoftwareUpdatePayload
  } catch {
    return null
  } finally {
    window.clearTimeout(timeout)
  }
}
