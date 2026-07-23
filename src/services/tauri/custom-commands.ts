import type { CustomCommandItem } from '@/types/custom-command'

const STORAGE_KEY = 'cs2-bot-improver.custom-commands'

export interface CustomCommandsPayload {
  items: CustomCommandItem[]
  storagePath: string
  exists: boolean
}

export function loadCustomCommands() {
  const raw = window.localStorage.getItem(STORAGE_KEY)
  const items = raw ? JSON.parse(raw) as CustomCommandItem[] : []
  return Promise.resolve({
    items: Array.isArray(items) ? items : [],
    storagePath: 'localStorage',
    exists: items.length > 0,
  })
}

export function saveCustomCommands(items: CustomCommandItem[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  return Promise.resolve({
    items,
    storagePath: 'localStorage',
    exists: true,
  })
}
