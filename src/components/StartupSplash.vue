<script setup lang="ts">
import { onMounted, ref } from 'vue'

import appIconUrl from '../../src-tauri/icons/icon.png?url'
import { ensureSoftwareUpdateChecked } from '@/features/software-updates/state'

const emit = defineEmits<{
  done: []
}>()

const MIN_SPLASH_MS = 1400
const visible = ref(true)

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

onMounted(async () => {
  await Promise.all([
    wait(MIN_SPLASH_MS),
    ensureSoftwareUpdateChecked(),
  ])

  visible.value = false
  emit('done')
})
</script>

<template>
  <div v-if="visible" class="startup-splash" role="status" aria-live="polite" aria-label="正在启动">
    <div class="startup-splash__mark">
      <img :src="appIconUrl" alt="" />
    </div>
  </div>
</template>
