import { invoke } from '@tauri-apps/api/core'

import type { DesktopRuntimeContext } from '@/types/app'

export async function getRuntimeContext() {
  return invoke<DesktopRuntimeContext>('get_runtime_context')
}

export async function openExternalUrl(url: string) {
  return invoke<void>('open_external_url', { url })
}

export function getFrontendContext() {
  return {
    appName: import.meta.env.VITE_APP_NAME,
    channel: import.meta.env.VITE_APP_CHANNEL,
    apiBaseUrl: import.meta.env.VITE_API_BASE_URL,
    updateFeedUrl: import.meta.env.VITE_UPDATE_FEED_URL,
    updaterEnabled: import.meta.env.VITE_ENABLE_UPDATER === 'true',
  }
}
