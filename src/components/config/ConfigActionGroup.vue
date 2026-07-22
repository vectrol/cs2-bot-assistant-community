<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

withDefaults(
  defineProps<{
    primaryLabel: string
    secondaryLabel?: string
    resetLabel?: string
    primaryDisabled?: boolean
    secondaryDisabled?: boolean
    resetDisabled?: boolean
    busy?: boolean
  }>(),
  {
    secondaryLabel: undefined,
    resetLabel: '',
    primaryDisabled: false,
    secondaryDisabled: false,
    resetDisabled: false,
    busy: false,
  },
)

const emit = defineEmits<{
  primary: []
  secondary: []
  reset: []
}>()
</script>

<template>
  <div class="config-action-group">
    <button class="primary-button" type="button" :disabled="primaryDisabled || busy" @click="emit('primary')">
      {{ primaryLabel }}
    </button>
    <button class="ghost-button" type="button" :disabled="secondaryDisabled || busy" @click="emit('secondary')">
      {{ secondaryLabel ?? t('config.secondaryReload') }}
    </button>
    <button
      v-if="resetLabel"
      class="ghost-button"
      type="button"
      :disabled="resetDisabled || busy"
      @click="emit('reset')"
    >
      {{ resetLabel }}
    </button>
  </div>
</template>
