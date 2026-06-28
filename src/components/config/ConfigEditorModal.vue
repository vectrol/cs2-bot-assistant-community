<script setup lang="ts">
import ActionModal from '@/components/ActionModal.vue'

withDefaults(
  defineProps<{
    open: boolean
    title: string
    description: string
    saveLabel?: string
    saveDisabled?: boolean
    loading?: boolean
  }>(),
  {
    saveLabel: '保存设置',
    saveDisabled: false,
    loading: false,
  },
)

const emit = defineEmits<{
  close: []
  save: []
}>()
</script>

<template>
  <ActionModal
    :open="open"
    :title="title"
    :subtitle="description"
    :confirm-label="saveLabel"
    :confirm-disabled="saveDisabled"
    :loading="loading"
    size="lg"
    @close="emit('close')"
    @confirm="emit('save')"
  >
    <slot />
    <template #actions>
      <slot name="actions" />
    </template>
  </ActionModal>
</template>
