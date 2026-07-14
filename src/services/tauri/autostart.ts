import { invoke } from '@tauri-apps/api/core'

export async function enableAutostart() {
  await invoke<void>('enable_autostart')
}

export async function disableAutostart() {
  await invoke<void>('disable_autostart')
}

export async function isAutostartEnabled() {
  return invoke<boolean>('is_autostart_enabled')
}
