<script setup lang="ts">
import CopyButton from '@/components/CopyButton.vue'

defineProps<{
  canOpenDemo: boolean
  busy?: boolean
}>()

const emit = defineEmits<{
  refresh: []
  openGame: []
  openConfig: []
  openDemos: []
  copiedLaunchOption: [text: string]
}>()
</script>

<template>
  <div class="quick-actions-bar" aria-label="快捷动作">
    <button class="ghost-button" type="button" :disabled="busy" @click="emit('refresh')">重新检查</button>
    <button class="primary-button" type="button" @click="emit('openGame')">打开 CS2</button>
    <button class="ghost-button" type="button" @click="emit('openConfig')">进入游戏配置</button>
    <CopyButton text="-insecure" label="复制 -insecure" copied-label="已复制 -insecure" @copied="emit('copiedLaunchOption', $event)" />
    <button class="ghost-button" type="button" :disabled="!canOpenDemo || busy" @click="emit('openDemos')">打开 Demo 目录</button>
  </div>
</template>
