<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useWorkspaceStore } from '@/stores/workspace'

const { t } = useI18n()
const workspace = useWorkspaceStore()

const detailFields: Array<{ key: keyof typeof t; field: string }> = [
  { key: 'workspace.projects.fieldId', field: 'id' },
  { key: 'workspace.projects.fieldStatus', field: 'status' },
  { key: 'workspace.projects.fieldChannel', field: 'channel' },
  { key: 'workspace.projects.fieldRootDir', field: 'rootDir' },
  { key: 'workspace.projects.fieldDistDir', field: 'distDir' },
  { key: 'workspace.projects.fieldBundleDir', field: 'bundleDir' },
  { key: 'workspace.projects.fieldLogDir', field: 'logDir' },
  { key: 'workspace.projects.fieldTauriConfig', field: 'tauriConfig' },
]
</script>

<template>
  <section class="panel">
    <p class="eyebrow">{{ t('workspace.projects.title') }}</p>
    <div class="project-grid">
      <article
        v-for="project in workspace.projects"
        :key="project.id"
        class="project-card"
        :data-active="workspace.activeProject?.id === project.id"
      >
        <div class="project-card-header">
          <div>
            <h3>{{ project.name }}</h3>
            <p class="muted">{{ project.description }}</p>
          </div>
          <button type="button" class="project-button" @click="workspace.setActiveProject(project.id)">
            {{ workspace.activeProject?.id === project.id ? t('workspace.projects.current') : t('workspace.projects.select') }}
          </button>
        </div>

        <dl class="project-meta">
          <div v-for="f in detailFields" :key="f.field">
            <dt>{{ t(f.key) }}</dt>
            <dd><code>{{ (project as any)[f.field] }}</code></dd>
          </div>
        </dl>
      </article>
    </div>
  </section>
</template>
