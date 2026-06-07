import { ref } from 'vue'
import { defineStore } from 'pinia'

import { appConfig } from '@/config/app'
import {
  loadCustomCommands,
  saveCustomCommands,
  type CustomCommandsPayload,
} from '@/services/tauri/custom-commands'
import type { CustomCommandItem } from '@/types/custom-command'

const STORAGE_KEY = appConfig.customCommandsStorageKey
const MIGRATED_KEY = `${STORAGE_KEY}.migrated-to-file`

interface CustomCommandDraft {
  title: string
  description: string
  command: string
}

function readStorage(): CustomCommandItem[] {
  if (typeof window === 'undefined') {
    return []
  }

  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    return []
  }

  try {
    const parsed = JSON.parse(raw) as CustomCommandItem[]
    if (!Array.isArray(parsed)) {
      return []
    }
    return parsed.filter((item) => typeof item?.id === 'string' && typeof item?.command === 'string')
  } catch {
    return []
  }
}

function markMigrated() {
  window.localStorage.setItem(MIGRATED_KEY, 'true')
}

function hasMigrated() {
  return window.localStorage.getItem(MIGRATED_KEY) === 'true'
}

function makeId() {
  return `cmd-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export const useCustomCommandsStore = defineStore('customCommands', () => {
  const items = ref<CustomCommandItem[]>([])
  const storagePath = ref('')
  const initialized = ref(false)
  const busy = ref(false)

  async function initialize() {
    if (initialized.value || busy.value) {
      return
    }

    busy.value = true
    try {
      const payload = await loadCustomCommands()
      storagePath.value = payload.storagePath

      if (payload.exists) {
        items.value = payload.items
        markMigrated()
        initialized.value = true
        return
      }

      const legacyItems = hasMigrated() ? [] : readStorage()
      if (legacyItems.length > 0) {
        const migratedPayload = await saveCustomCommands(legacyItems)
        applyPayload(migratedPayload)
        markMigrated()
        initialized.value = true
        return
      }

      items.value = []
      initialized.value = true
    } finally {
      busy.value = false
    }
  }

  function applyPayload(payload: CustomCommandsPayload) {
    items.value = payload.items
    storagePath.value = payload.storagePath
  }

  async function save(itemsToSave: CustomCommandItem[]) {
    const payload = await saveCustomCommands(itemsToSave)
    applyPayload(payload)
    markMigrated()
  }

  function saveFallback(itemsToSave: CustomCommandItem[]) {
    items.value = itemsToSave
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(itemsToSave))
  }

  async function addCommand(draft: CustomCommandDraft) {
    const now = new Date().toISOString()
    const nextItem: CustomCommandItem = {
      id: makeId(),
      title: draft.title.trim(),
      description: draft.description.trim(),
      command: draft.command.trim(),
      createdAt: now,
      updatedAt: now,
    }

    await save([nextItem, ...items.value])
  }

  async function updateCommand(id: string, draft: CustomCommandDraft) {
    const now = new Date().toISOString()
    await save(
      items.value.map((item) =>
        item.id === id
          ? {
              ...item,
              title: draft.title.trim(),
              description: draft.description.trim(),
              command: draft.command.trim(),
              updatedAt: now,
            }
          : item,
      ),
    )
  }

  async function deleteCommand(id: string) {
    await save(items.value.filter((item) => item.id !== id))
  }

  return {
    items,
    storagePath,
    initialized,
    busy,
    initialize,
    saveFallback,
    addCommand,
    updateCommand,
    deleteCommand,
  }
})
