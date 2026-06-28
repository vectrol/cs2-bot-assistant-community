import { invoke } from '@tauri-apps/api/core'

import type { CustomCommandItem } from '@/types/custom-command'

export interface CustomCommandsPayload {
  items: CustomCommandItem[]
  storagePath: string
  exists: boolean
}

function isTauriRuntime() {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window
}

export function loadCustomCommands() {
  if (!isTauriRuntime()) {
    const raw = window.localStorage.getItem('cs2-bot-improver.custom-commands')
    const items = raw ? JSON.parse(raw) as CustomCommandItem[] : []
    return Promise.resolve({
      items: Array.isArray(items) ? items : [],
      storagePath: 'localStorage',
      exists: items.length > 0,
    })
  }
  return invoke<CustomCommandsPayload>('load_custom_commands')
}

export function saveCustomCommands(items: CustomCommandItem[]) {
  if (!isTauriRuntime()) {
    window.localStorage.setItem('cs2-bot-improver.custom-commands', JSON.stringify(items))
    return Promise.resolve({
      items,
      storagePath: 'localStorage',
      exists: true,
    })
  }
  return invoke<CustomCommandsPayload>('save_custom_commands', { items })
}
