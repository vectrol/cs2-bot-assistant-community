<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import StatusPill from '@/components/ui/StatusPill.vue'
import { appConfig } from '@/config/app'
import { useCs2Store } from '@/stores/cs2'

const store = useCs2Store()
const { t } = useI18n()

const environmentState = computed(() => {
  if (!store.selectedRoot) {
    return { label: t('settings.storage'), value: t('guide.notChecked'), state: 'warn' as const }
  }
  if (store.readyForConfig) {
    return { label: t('guide.environmentTitle'), value: t('status.ready'), state: 'ready' as const }
  }
  return { label: t('guide.environmentTitle'), value: t('guide.installPackage'), state: 'warn' as const }
})
</script>

<template>
  <section class="global-status-bar" :aria-label="t('app.cs2Running')">
    <div class="global-status-bar__pills">
      <StatusPill
        label="CS2"
        :value="store.cs2Running ? t('app.cs2Running') : t('app.cs2NotRunning')"
        :state="store.cs2Running ? 'danger' : 'ready'"
      />
      <StatusPill
        :label="environmentState.label"
        :value="environmentState.value"
        :state="environmentState.state"
      />
      <StatusPill
        :label="t('guide.selectRoot')"
        :value="store.selectedRoot ? t('nav.config') : t('guide.notChecked')"
        :state="store.selectedRoot ? 'ready' : 'warn'"
      />
      <StatusPill :label="t('app.version')" :value="`v${appConfig.appVersion}`" state="info" />
    </div>

    <div class="global-status-bar__trail">
      <span v-if="store.busy">{{ t('status.busy') }}</span>
      <span v-else>{{ t('status.ready') }}</span>
    </div>
  </section>
</template>
