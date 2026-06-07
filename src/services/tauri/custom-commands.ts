import { invoke } from '@tauri-apps/api/core'

import type { CustomCommandItem } from '@/types/custom-command'

export interface CustomCommandsPayload {
  items: CustomCommandItem[]
  storagePath: string
  exists: boolean
}

export function loadCustomCommands() {
  return invoke<CustomCommandsPayload>('load_custom_commands')
}

export function saveCustomCommands(items: CustomCommandItem[]) {
  return invoke<CustomCommandsPayload>('save_custom_commands', { items })
}
