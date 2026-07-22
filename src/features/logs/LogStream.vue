<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useWorkspaceStore } from '@/stores/workspace'

const { t } = useI18n()
const workspace = useWorkspaceStore()
</script>

<template>
  <section class="panel">
    <p class="eyebrow">{{ t('workspace.logs.title') }}</p>
    <pre class="log-box">{{ t('workspace.logs.content', {
      logDir: workspace.activeProject?.logDir,
      bundleDir: workspace.activeProject?.bundleDir,
    }) }}</pre>
  </section>
</template>
