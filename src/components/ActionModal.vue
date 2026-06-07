<script setup lang="ts">
withDefaults(
  defineProps<{
    open: boolean
    title: string
    subtitle?: string
    confirmLabel?: string
    cancelLabel?: string
    danger?: boolean
    hideConfirm?: boolean
  }>(),
  {
    subtitle: '',
    confirmLabel: '确认',
    cancelLabel: '取消',
    danger: false,
    hideConfirm: false,
  },
)

const emit = defineEmits<{
  close: []
  confirm: []
}>()
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="modal-backdrop" role="dialog" aria-modal="true" :aria-label="title">
      <article class="action-modal">
        <div class="section-head">
          <div>
            <p class="eyebrow">{{ danger ? '确认操作' : '操作' }}</p>
            <h3>{{ title }}</h3>
            <p v-if="subtitle" class="muted">{{ subtitle }}</p>
          </div>
          <button class="ghost-button action-modal__close" type="button" @click="emit('close')">关闭</button>
        </div>

        <div class="action-modal__body">
          <slot />
        </div>

        <div class="actions-row release-actions">
          <slot name="actions" />
          <button class="ghost-button" type="button" @click="emit('close')">{{ cancelLabel }}</button>
          <button
            v-if="!hideConfirm"
            class="primary-button"
            :class="{ 'danger-primary-button': danger }"
            type="button"
            @click="emit('confirm')"
          >
            {{ confirmLabel }}
          </button>
        </div>
      </article>
    </div>
  </Teleport>
</template>
