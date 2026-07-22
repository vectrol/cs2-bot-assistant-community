<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { useCs2Store } from '@/stores/cs2'

const { t } = useI18n()
const store = useCs2Store()
const visible = ref(false)
const message = ref('')
let toastTimer: ReturnType<typeof setTimeout> | null = null

const dangerPatterns = ['fail', 'error', 'failed', 'denied', 'exception', 'unable']
const warnPatterns = ['please', 'need', 'running', 'not found', 'not select', 'no ', 'pending', 'warn', 'missing', 'exit', 'quit']
const readyPatterns = ['saved', 'copied', 'selected', 'installed', 'deleted', 'restored', 'success', 'refreshed', 'complete']

const toastState = computed<'ready' | 'warn' | 'danger' | 'info'>(() => {
  const text = message.value.toLowerCase()
  if (dangerPatterns.some(p => text.includes(p))) return 'danger'
  if (warnPatterns.some(p => text.includes(p))) return 'warn'
  if (readyPatterns.some(p => text.includes(p))) return 'ready'
  return 'info'
})

const toastTitle = computed(() => t(`toast.${toastState.value}`))

function showToast(nextMessage: string) {
  if (!nextMessage.trim()) return
  message.value = nextMessage
  visible.value = true
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { visible.value = false; toastTimer = null }, 4000)
}

watch(() => store.message, (nextMessage) => {
  if (nextMessage) showToast(nextMessage)
})

onBeforeUnmount(() => {
  if (toastTimer) clearTimeout(toastTimer)
})
</script>

<template>
  <div v-if="visible" class="global-toast" :data-state="toastState" role="status" aria-live="polite">
    <div class="floating-toast__title">{{ toastTitle }}</div>
    <div class="floating-toast__body">{{ message }}</div>
  </div>
</template>
