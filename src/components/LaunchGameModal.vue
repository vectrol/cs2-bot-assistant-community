<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { useCs2Store } from '@/stores/cs2'

const { t } = useI18n()

defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

const STORAGE_KEY = 'cs2-custom-launch-args'

const store = useCs2Store()
const launching = ref(false)
const launchMode = ref<'steam' | 'direct'>('steam')
const insecureEnabled = ref(true)
const customArgs = ref('')

const hasSelectedRoot = computed(() => !!store.selectedRoot)
const cs2Running = computed(() => store.cs2Running)

const modeOptions = computed(() => [
  { value: 'steam' as const, label: t('launchModal.steam'), detail: t('launchModal.steamDetail') },
  { value: 'direct' as const, label: t('launchModal.direct'), detail: t('launchModal.directDetail') },
])

function loadCustomArgs() {
  if (typeof window !== 'undefined') {
    customArgs.value = window.localStorage.getItem(STORAGE_KEY) || ''
  }
}

function saveCustomArgs() {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, customArgs.value)
  }
}

loadCustomArgs()

async function launchGame() {
  launching.value = true
  try {
    if (launchMode.value === 'direct') {
      const extra = customArgs.value.trim()
        ? customArgs.value.trim().split(/\s+/).filter(Boolean)
        : []
      await store.launchGameDirect(insecureEnabled.value, extra)
      saveCustomArgs()
    } else {
      await store.launchGame()
    }
    emit('close')
  } finally {
    launching.value = false
  }
}

const launchLabel = computed(() => {
  if (launching.value) return t('launchModal.launching')
  if (launchMode.value === 'steam') return t('launchModal.launchSteam')
  const extra = customArgs.value.trim()
  return extra ? `${t('launchModal.launchDirect')} (${extra})` : insecureEnabled.value ? `${t('launchModal.launchDirect')} (-insecure)` : t('launchModal.launchDirect')
})
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="modal-backdrop launch-game-backdrop" style="animation: fade-in 0.15s ease;" role="dialog" aria-modal="true" aria-label="启动游戏">
      <article class="launch-game-modal glass" style="backdrop-filter: blur(28px); animation: scale-in 0.2s ease;">
        <button class="launch-game-modal__close" type="button" aria-label="关闭" @click="emit('close')">
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
        <div class="launch-game-modal__scanline" aria-hidden="true" />
        <div class="launch-game-modal__content">
          <p class="eyebrow">{{ t('launchModal.selectMode') }}</p>
          <h3>{{ t('launchModal.title') }}</h3>

          <fieldset class="launch-mode-group">
            <legend class="sr-only">启动模式</legend>
            <label
              v-for="option in modeOptions"
              :key="option.value"
              class="launch-mode-option"
              :class="{ active: launchMode === option.value }"
            >
              <input
                type="radio"
                :value="option.value"
                v-model="launchMode"
                class="sr-only"
              />
              <span class="launch-mode-option__indicator" aria-hidden="true" />
              <span class="launch-mode-option__label">{{ option.label }}</span>
              <span class="launch-mode-option__detail">{{ option.detail }}</span>
            </label>
          </fieldset>

          <label
            v-if="launchMode === 'direct'"
            class="insecure-toggle"
            :class="{ disabled: !hasSelectedRoot || cs2Running }"
          >
            <input
              type="checkbox"
              v-model="insecureEnabled"
              :disabled="!hasSelectedRoot || cs2Running"
            />
            <span class="insecure-toggle__label">{{ t('launchModal.insecure') }}</span>
            <span class="insecure-toggle__hint">{{ t('launchModal.insecureHint') }}</span>
          </label>

          <label
            v-if="launchMode === 'direct'"
            class="custom-args-field"
          >
            <span class="custom-args-field__label">{{ t('launchModal.customArgs') }}</span>
            <input
              type="text"
              v-model="customArgs"
              class="custom-args-field__input"
              :placeholder="t('launchModal.customArgsPlaceholder')"
              :disabled="!hasSelectedRoot || cs2Running"
            />
            <span class="custom-args-field__hint">{{ t('launchModal.customArgsHint') }}</span>
          </label>

          <p v-if="cs2Running" class="inline-warn">{{ t('launchModal.cs2Running') }}</p>
          <p v-if="launchMode === 'direct' && !hasSelectedRoot" class="inline-warn">{{ t('launchModal.noRoot') }}</p>

          <button
            class="launch-game-button"
            type="button"
            :disabled="launching || cs2Running || (launchMode === 'direct' && !hasSelectedRoot)"
            @click="launchGame"
          >
            <span class="launch-game-button__halo" aria-hidden="true" />
            <span>{{ launchLabel }}</span>
          </button>
        </div>
      </article>
    </div>
  </Teleport>
</template>

<style scoped>
.launch-mode-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
  border: none;
  padding: 0;
}

.launch-mode-option {
  display: grid;
  grid-template-columns: auto 1fr;
  grid-template-rows: auto auto;
  gap: 0.125rem 0.5rem;
  padding: 0.625rem 0.75rem;
  border: 1px solid var(--border-muted);
  border-radius: 6px;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
}

.launch-mode-option:hover {
  border-color: var(--border-subtle);
}

.launch-mode-option.active {
  border-color: var(--accent);
  background: color-mix(in srgb, var(--accent) 8%, transparent);
}

.launch-mode-option__indicator {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 1.5px solid var(--border-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 2px;
}

.launch-mode-option.active .launch-mode-option__indicator {
  border-color: var(--accent);
  background: var(--accent);
  box-shadow: inset 0 0 0 3px var(--bg-primary);
}

.launch-mode-option__label {
  font-weight: 600;
  font-size: 0.875rem;
}

.launch-mode-option__detail {
  grid-column: 2;
  font-size: 0.75rem;
  color: var(--text-muted);
  line-height: 1.4;
}

.insecure-toggle {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--border-muted);
  border-radius: 6px;
  cursor: pointer;
}

.insecure-toggle.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.insecure-toggle__label {
  font-weight: 600;
  font-size: 0.875rem;
}

.custom-args-field {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--border-muted);
  border-radius: 6px;
}

.custom-args-field__label {
  font-weight: 600;
  font-size: 0.875rem;
  width: 100%;
}

.custom-args-field__input {
  width: 100%;
  padding: 0.4rem 0.6rem;
  border: 1px solid var(--border-muted);
  border-radius: 4px;
  background: var(--field-bg);
  color: var(--text-primary);
  font-size: 0.8125rem;
  font-family: var(--font-mono);
  outline: none;
  transition: border-color 0.15s;
}

.custom-args-field__input:focus {
  border-color: var(--accent);
}

.custom-args-field__hint {
  width: 100%;
  font-size: 0.75rem;
  color: var(--text-muted);
}

.insecure-toggle__hint {
  width: 100%;
  font-size: 0.75rem;
  color: var(--text-muted);
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
}

.inline-warn {
  margin-bottom: 0.75rem;
  padding: 0.5rem 0.75rem;
  font-size: 0.8125rem;
  color: var(--text-warn, #d97706);
  background: color-mix(in srgb, var(--text-warn, #d97706) 10%, transparent);
  border-radius: 5px;
  border: 1px solid color-mix(in srgb, var(--text-warn, #d97706) 25%, transparent);
}
</style>
