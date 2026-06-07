<script setup lang="ts">
import { onMounted, ref } from 'vue'

import { getFrontendContext, getRuntimeContext } from '@/services/tauri/app'
import { useWorkspaceStore } from '@/stores/workspace'
import type { DesktopRuntimeContext } from '@/types/app'

const frontend = getFrontendContext()
const workspace = useWorkspaceStore()
const runtime = ref<DesktopRuntimeContext | null>(null)
const error = ref<string | null>(null)

onMounted(async () => {
  try {
    runtime.value = await getRuntimeContext()
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : String(reason)
  }
})
</script>

<template>
  <section class="panel-grid">
    <article class="panel">
      <p class="eyebrow">前端上下文</p>
      <dl class="kv">
        <div>
          <dt>应用名称</dt>
          <dd>{{ frontend.appName }}</dd>
        </div>
        <div>
          <dt>发布通道</dt>
          <dd>{{ frontend.channel }}</dd>
        </div>
        <div>
          <dt>API 基地址</dt>
          <dd>{{ frontend.apiBaseUrl }}</dd>
        </div>
        <div>
          <dt>更新器</dt>
          <dd>{{ frontend.updaterEnabled ? '已启用' : '未启用' }}</dd>
        </div>
        <div>
          <dt>默认项目</dt>
          <dd>{{ workspace.activeProject?.id }}</dd>
        </div>
      </dl>
    </article>

    <article class="panel">
      <p class="eyebrow">桌面运行时</p>
      <dl v-if="runtime" class="kv">
        <div>
          <dt>应用版本</dt>
          <dd>{{ runtime.appVersion }}</dd>
        </div>
        <div>
          <dt>目标架构</dt>
          <dd>{{ runtime.target }}</dd>
        </div>
        <div>
          <dt>Rust 配置</dt>
          <dd>{{ runtime.profile }}</dd>
        </div>
        <div>
          <dt>Crate</dt>
          <dd>{{ runtime.rustCrate }}</dd>
        </div>
      </dl>
      <p v-else-if="error" class="warning">
        {{ error }}
      </p>
      <p v-else class="muted">正在读取 Tauri 运行时上下文...</p>
    </article>
  </section>
</template>
