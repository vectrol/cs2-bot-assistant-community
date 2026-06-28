<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

onMounted(() => {
  router.replace({ path: '/commands', query: { tab: 'custom' } })
})
</script>

<template>
  <section class="page-grid">
    <article class="card">
      <p class="eyebrow">指令中心</p>
      <h3>正在打开自定义指令</h3>
      <p class="muted">自定义指令已经并入指令中心。</p>
    </article>
  </section>
</template>
