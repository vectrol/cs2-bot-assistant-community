<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = withDefaults(
  defineProps<{
    text: string
    label?: string
    copiedLabel?: string
    failedLabel?: string
    variant?: 'primary' | 'ghost'
    disabled?: boolean
    copyWithoutSemicolon?: boolean
  }>(),
  {
    label: undefined,
    copiedLabel: undefined,
    failedLabel: undefined,
    variant: 'ghost',
    disabled: false,
    copyWithoutSemicolon: true,
  },
)

const emit = defineEmits<{
  copied: [text: string]
  failed: []
}>()

const copied = ref(false)
const failed = ref(false)
let copiedTimer: ReturnType<typeof setTimeout> | null = null

async function writeClipboardText(text: string) {
  try {
    await navigator.clipboard?.writeText(text)
    return true
  } catch {
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.setAttribute('readonly', 'true')
    textarea.style.position = 'fixed'
    textarea.style.top = '-9999px'
    document.body.appendChild(textarea)
    textarea.select()
    try {
      return document.execCommand('copy')
    } finally {
      document.body.removeChild(textarea)
    }
  }
}

async function copy() {
  const trimmed = props.text.trim()
  const text = props.copyWithoutSemicolon || trimmed.endsWith(';') ? trimmed : `${trimmed};`
  if (!text || props.disabled) {
    return
  }

  const ok = await writeClipboardText(text)
  if (!ok) {
    failed.value = true
    emit('failed')
    if (copiedTimer) {
      clearTimeout(copiedTimer)
    }
    copiedTimer = setTimeout(() => {
      failed.value = false
      copiedTimer = null
    }, 1400)
    return
  }

  copied.value = true
  failed.value = false
  emit('copied', text)
  if (copiedTimer) {
    clearTimeout(copiedTimer)
  }
  copiedTimer = setTimeout(() => {
    copied.value = false
    copiedTimer = null
  }, 1200)
}

onBeforeUnmount(() => {
  if (copiedTimer) {
    clearTimeout(copiedTimer)
  }
})
</script>

<template>
  <button
    :class="variant === 'primary' ? 'primary-button' : 'ghost-button'"
    type="button"
    :disabled="disabled"
    @click="copy"
  >
    {{ failed ? (failedLabel ?? t('copyButton.failed')) : copied ? (copiedLabel ?? t('copyButton.copied')) : (label ?? t('copyButton.copy')) }}
  </button>
</template>
