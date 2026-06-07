<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'

import { useCs2Store } from '@/stores/cs2'

const store = useCs2Store()
const visible = ref(false)
const message = ref('')
let toastTimer: ReturnType<typeof setTimeout> | null = null

function showToast(nextMessage: string) {
  if (!nextMessage.trim()) {
    return
  }

  message.value = nextMessage
  visible.value = true
  if (toastTimer) {
    clearTimeout(toastTimer)
  }
  toastTimer = setTimeout(() => {
    visible.value = false
    toastTimer = null
  }, 4000)
}

watch(
  () => store.message,
  (nextMessage) => {
    if (nextMessage) {
      showToast(nextMessage)
    }
  },
)

onBeforeUnmount(() => {
  if (toastTimer) {
    clearTimeout(toastTimer)
  }
})
</script>

<template>
  <div v-if="visible" class="global-toast" role="status" aria-live="polite">
    <div class="floating-toast__title">提示</div>
    <div class="floating-toast__body">{{ message }}</div>
  </div>
</template>
