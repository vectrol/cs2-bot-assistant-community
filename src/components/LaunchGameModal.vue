<script setup lang="ts">
import { ref } from 'vue'

import { useCs2Store } from '@/stores/cs2'

defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

const store = useCs2Store()
const launching = ref(false)

async function launchGame() {
  launching.value = true
  try {
    await store.launchGame()
    emit('close')
  } finally {
    launching.value = false
  }
}
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
          <p class="eyebrow">Steam 启动</p>
          <h3>启动 Counter-Strike 2</h3>
          <p class="muted">
            将通过 Steam 协议启动 CS2，由 Steam 处理账号、更新、库路径和启动项。
          </p>
          <button class="launch-game-button" type="button" :disabled="launching" @click="launchGame">
            <span class="launch-game-button__halo" aria-hidden="true" />
            <span>{{ launching ? '正在发送启动请求' : '启动 CS2' }}</span>
          </button>
        </div>
      </article>
    </div>
  </Teleport>
</template>
