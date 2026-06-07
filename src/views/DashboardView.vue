<script setup lang="ts">
import RuntimePanel from '@/features/dashboard/RuntimePanel.vue'
import { useWorkspaceStore } from '@/stores/workspace'

const workspace = useWorkspaceStore()
</script>

<template>
  <section class="view-grid">
    <article class="hero-card">
      <p class="eyebrow">Workspace host</p>
      <h3>Ship multiple desktop projects without shared state collisions.</h3>
      <p class="muted">
        Each project gets its own source root, dist directory, bundle directory, and log directory.
        The workspace registry is validated before builds so one project's output cannot silently
        overwrite another's.
      </p>
    </article>

    <article class="panel">
      <p class="eyebrow">Active project</p>
      <h3>{{ workspace.activeProject?.name }}</h3>
      <p class="muted">{{ workspace.activeProject?.description }}</p>
      <dl class="kv">
        <div>
          <dt>Project root</dt>
          <dd><code>{{ workspace.activeProject?.rootDir }}</code></dd>
        </div>
        <div>
          <dt>Bundle path</dt>
          <dd><code>{{ workspace.activeProject?.bundleDir }}</code></dd>
        </div>
        <div>
          <dt>Log path</dt>
          <dd><code>{{ workspace.activeProject?.logDir }}</code></dd>
        </div>
      </dl>
    </article>

    <RuntimePanel />
  </section>
</template>
