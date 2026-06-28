<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    open: boolean
    title: string
    subtitle?: string
    confirmLabel?: string
    cancelLabel?: string
    danger?: boolean
    hideConfirm?: boolean
    confirmDisabled?: boolean
    loading?: boolean
    size?: 'sm' | 'md' | 'lg'
    closeOnEsc?: boolean
  }>(),
  {
    subtitle: '',
    confirmLabel: '确认',
    cancelLabel: '取消',
    danger: false,
    hideConfirm: false,
    confirmDisabled: false,
    loading: false,
    size: 'md',
    closeOnEsc: true,
  },
)

const emit = defineEmits<{
  close: []
  confirm: []
}>()

const modalRef = ref<HTMLElement | null>(null)

function requestClose() {
  if (props.loading) {
    return
  }
  emit('close')
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && props.closeOnEsc && !props.danger) {
    requestClose()
  }
}

watch(
  () => props.open,
  async (open) => {
    if (!open) {
      return
    }
    await nextTick()
    modalRef.value?.focus()
  },
)

onBeforeUnmount(() => {
  modalRef.value = null
})
</script>

<template>
  <Teleport to="body">
    <div v-if="props.open" class="modal-backdrop" @keydown="handleKeydown">
      <article
        ref="modalRef"
        class="action-modal"
        :data-size="props.size"
        role="dialog"
        aria-modal="true"
        :aria-label="props.title"
        tabindex="-1"
      >
        <div class="section-head">
          <div>
            <p class="eyebrow">{{ props.danger ? '确认操作' : '操作' }}</p>
            <h3>{{ props.title }}</h3>
            <p v-if="props.subtitle" class="muted">{{ props.subtitle }}</p>
          </div>
          <button class="ghost-button action-modal__close" type="button" :disabled="props.loading" @click="requestClose">关闭</button>
        </div>

        <div class="action-modal__body">
          <slot />
        </div>

        <div class="actions-row release-actions">
          <slot name="actions" />
          <button class="ghost-button" type="button" :disabled="props.loading" @click="requestClose">{{ props.cancelLabel }}</button>
          <button
            v-if="!props.hideConfirm"
            class="primary-button"
            :class="{ 'danger-primary-button': props.danger }"
            type="button"
            :disabled="props.confirmDisabled || props.loading"
            @click="emit('confirm')"
          >
            {{ props.loading ? '处理中' : props.confirmLabel }}
          </button>
        </div>
      </article>
    </div>
  </Teleport>
</template>
