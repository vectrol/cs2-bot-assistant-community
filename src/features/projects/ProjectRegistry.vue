<script setup lang="ts">
import { useWorkspaceStore } from '@/stores/workspace'

const workspace = useWorkspaceStore()
</script>

<template>
  <section class="panel">
    <p class="eyebrow">已注册项目</p>
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
            {{ workspace.activeProject?.id === project.id ? '当前项目' : '选择' }}
          </button>
        </div>

        <dl class="project-meta">
          <div>
            <dt>ID</dt>
            <dd>{{ project.id }}</dd>
          </div>
          <div>
            <dt>状态</dt>
            <dd>{{ project.status }}</dd>
          </div>
          <div>
            <dt>通道</dt>
            <dd>{{ project.channel }}</dd>
          </div>
          <div>
            <dt>源码目录</dt>
            <dd><code>{{ project.rootDir }}</code></dd>
          </div>
          <div>
            <dt>前端产物</dt>
            <dd><code>{{ project.distDir }}</code></dd>
          </div>
          <div>
            <dt>安装包</dt>
            <dd><code>{{ project.bundleDir }}</code></dd>
          </div>
          <div>
            <dt>日志</dt>
            <dd><code>{{ project.logDir }}</code></dd>
          </div>
          <div>
            <dt>Tauri 配置</dt>
            <dd><code>{{ project.tauriConfig }}</code></dd>
          </div>
        </dl>
      </article>
    </div>
  </section>
</template>
