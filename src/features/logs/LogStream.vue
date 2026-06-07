<script setup lang="ts">
import { useWorkspaceStore } from '@/stores/workspace'

const workspace = useWorkspaceStore()
</script>

<template>
  <section class="panel">
    <p class="eyebrow">日志路由</p>
    <pre class="log-box">前端：Vite 开发服务器和浏览器控制台
桌面端：Tauri CLI 和 Rust 命令输出
工作区：每次构建前的注册表验证
当前项目日志：{{ workspace.activeProject?.logDir }}
当前项目安装包：{{ workspace.activeProject?.bundleDir }}</pre>
  </section>
</template>
