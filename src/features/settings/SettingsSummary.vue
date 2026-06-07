<script setup lang="ts">
import { getFrontendContext } from '@/services/tauri/app'
import { useWorkspaceStore } from '@/stores/workspace'

const frontend = getFrontendContext()
const workspace = useWorkspaceStore()
</script>

<template>
  <section class="panel">
    <p class="eyebrow">配置来源</p>
    <ul class="settings-list">
      <li><code>.env</code> 和模式专用文件定义前端常量。</li>
      <li><code>config/workspace/projects.json</code> 是工作区项目注册表。</li>
      <li><code>src/config/workspace/projects.json</code> 是前端壳读取的注册表镜像。</li>
      <li><code>src-tauri/tauri.conf.json</code> 定义桌面壳基线。</li>
      <li><code>src-tauri/tauri.*.json</code> 保留给不同通道覆盖配置。</li>
      <li>当前 API 基地址：<code>{{ frontend.apiBaseUrl }}</code></li>
      <li>默认项目：<code>{{ workspace.activeProject?.id }}</code></li>
    </ul>
  </section>
</template>
