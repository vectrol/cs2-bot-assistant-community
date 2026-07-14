import { appConfig } from '@/config/app'
import type { SoftwareUpdatePayload } from '@/features/software-updates/types'

const UPDATE_CHECK_TIMEOUT_MS = 6000
const RELEASE_HISTORY_TIMEOUT_MS = 30000

export interface FetchSoftwareUpdatesOptions {
  ignoreUpdaterDisabled?: boolean
  throwOnError?: boolean
  timeoutMs?: number
}

export type SoftwareReleaseHistoryResult =
  | { status: 'online'; payload: SoftwareUpdatePayload }
  | { status: 'empty'; payload: SoftwareUpdatePayload }
  | { status: 'not-configured'; payload: null }
  | { status: 'failed'; payload: null }

export async function fetchSoftwareUpdates(options: FetchSoftwareUpdatesOptions = {}) {
  if ((!options.ignoreUpdaterDisabled && !appConfig.updaterEnabled) || !appConfig.updateFeedUrl) {
    return null
  }

  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), options.timeoutMs ?? UPDATE_CHECK_TIMEOUT_MS)

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
      if (options.throwOnError) {
        throw new Error(`Software update feed returned HTTP ${response.status}`)
      }
      return null
    }

    return (await response.json()) as SoftwareUpdatePayload
  } catch (error) {
    if (options.throwOnError) {
      throw error
    }
    return null
  } finally {
    window.clearTimeout(timeout)
  }
}

export async function fetchSoftwareReleaseHistory(): Promise<SoftwareReleaseHistoryResult> {
  if (!appConfig.updateFeedUrl) {
    return { status: 'not-configured', payload: null }
  }

  try {
    const payload = await fetchSoftwareUpdates({
      ignoreUpdaterDisabled: true,
      throwOnError: true,
      timeoutMs: RELEASE_HISTORY_TIMEOUT_MS,
    })

    if (!payload) {
      return { status: 'failed', payload: null }
    }

    return {
      status: payload.history.length ? 'online' : 'empty',
      payload,
    }
  } catch {
    return { status: 'failed', payload: null }
  }
}
