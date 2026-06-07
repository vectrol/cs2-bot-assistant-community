import { readonly, ref } from 'vue'

import type { SoftwareUpdatePayload } from '@/features/software-updates/types'
import { fetchSoftwareUpdates } from '@/services/software-updates'

const payload = ref<SoftwareUpdatePayload | null>(null)
const checkFinished = ref(false)
const checkFailed = ref(false)
let checkPromise: Promise<SoftwareUpdatePayload | null> | null = null

export function ensureSoftwareUpdateChecked() {
  if (checkPromise) {
    return checkPromise
  }

  checkFinished.value = false
  checkFailed.value = false
  checkPromise = fetchSoftwareUpdates()
    .then((nextPayload) => {
      payload.value = nextPayload
      return nextPayload
    })
    .catch(() => {
      checkFailed.value = true
      payload.value = null
      return null
    })
    .finally(() => {
      checkFinished.value = true
    })

  return checkPromise
}

export function useSoftwareUpdateState() {
  return {
    payload: readonly(payload),
    checkFinished: readonly(checkFinished),
    checkFailed: readonly(checkFailed),
    ensureSoftwareUpdateChecked,
  }
}

export function resetSoftwareUpdateStateForTest() {
  payload.value = null
  checkFinished.value = false
  checkFailed.value = false
  checkPromise = null
}
