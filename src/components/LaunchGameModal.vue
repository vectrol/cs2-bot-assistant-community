<script setup lang="ts">
import { computed, ref } from 'vue'

import { useCs2Store } from '@/stores/cs2'

defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

const store = useCs2Store()
const launching = ref(false)
const launchMode = ref<'steam' | 'direct'>('steam')
const insecureEnabled = ref(true)

const hasSelectedRoot = computed(() => !!store.selectedRoot)
const cs2Running = computed(() => store.cs2Running)

const modeOptions = [
  { value: 'steam' as const, label: 'Steam 协议', detail: '通过 steam:// 启动，Steam 管理启动项和-insecure。' },
  { value: 'direct' as const, label: '直接启动', detail: '绕过 Steam 直接运行 cs2.exe，需自行处理启动参数。' },
]

async function launchGame() {
  launching.value = true
  try {
    if (launchMode.value === 'direct') {
      await store.launchGameDirect(insecureEnabled.value)
    } else {
      await store.launchGame()
    }
    emit('close')
  } finally {
    launching.value = false
  }
}

const launchLabel = computed(() => {
  if (launching.value) return '正在发送启动请求'
  if (launchMode.value === 'steam') return '启动 CS2 (Steam)'
  return insecureEnabled.value ? '启动 CS2 (-insecure)' : '启动 CS2'
})
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="modal-backdrop launch-game-backdrop" role="dialog" aria-modal="true" aria-label="启动游戏">
      <article class="launch-game-modal">
        <button class="launch-game-modal__close" type="button" aria-label="关闭" @click="emit('close')">
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <path d="m7 7 10 10" />
            <path d="m17 7-10 10" />
          </svg>
        </button>
        <div class="launch-game-modal__scanline" aria-hidden="true" />
        <div class="launch-game-modal__content">
          <p class="eyebrow">选择启动方式</p>
          <h3>启动 Counter-Strike 2</h3>

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
            <span class="insecure-toggle__label">添加 -insecure 启动参数</span>
            <span class="insecure-toggle__hint">Bot 模式需要此参数，在线模式请关闭。</span>
          </label>

          <p v-if="cs2Running" class="inline-warn">CS2 正在运行，请先退出游戏再启动。</p>
          <p v-if="launchMode === 'direct' && !hasSelectedRoot" class="inline-warn">需要先选择 CS2 游戏目录才能直接启动。</p>

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
