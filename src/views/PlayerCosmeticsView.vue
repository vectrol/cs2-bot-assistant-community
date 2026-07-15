<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import InlineNotice from '@/components/ui/InlineNotice.vue'
import { useCs2Store } from '@/stores/cs2'

const store = useCs2Store()
const knifeConfig = ref('{}')
const gunConfig = ref('{}')
const message = ref('')

const ready = computed(() => Boolean(store.selectedRoot && store.playerCosmeticsConfig?.pluginPresent))

async function load() {
  try {
    const config = await store.refreshPlayerCosmeticsConfig()
    if (!config) {
      message.value = '请先选择 CS2 目录。'
      return
    }
    knifeConfig.value = config.knifeConfig
    gunConfig.value = config.gunConfig
    message.value = config.pluginPresent
      ? '已读取 PlayerKnifeCustomizer 配置。'
      : '当前资源包未检测到 PlayerKnifeCustomizer 插件。'
  } catch (error) {
    message.value = store.normalizeError(error)
  }
}

async function save() {
  const current = store.playerCosmeticsConfig
  if (!current) {
    message.value = '请先读取配置。'
    return
  }
  try {
    const result = await store.savePlayerCosmetics({
      ...current,
      knifeConfig: knifeConfig.value,
      gunConfig: gunConfig.value,
    })
    message.value = result.message
  } catch (error) {
    message.value = store.normalizeError(error)
  }
}

onMounted(() => {
  if (store.selectedRoot) {
    void load()
  }
})
</script>

<template>
  <section class="page-grid">
    <article class="hero-banner">
      <div>
        <p class="eyebrow">PlayerKnifeCustomizer</p>
        <h3>玩家外观</h3>
        <p class="muted">管理 Plus 的刀具、枪械、手套、音乐盒、名称标签、StatTrak 和纪念品预设。</p>
      </div>
      <div class="actions-row">
        <button class="ghost-button" type="button" :disabled="store.busy || !store.selectedRoot" @click="load">重新读取</button>
        <button class="primary-button" type="button" :disabled="store.busy || !ready" @click="save">保存外观配置</button>
      </div>
    </article>

    <InlineNotice v-if="message" :message="message" :state="message.includes('未检测') || message.includes('请先') ? 'warn' : 'info'" />

    <article class="card command-panel">
      <div class="section-head">
        <div>
          <p class="eyebrow">Knife / Glove / Music</p>
          <h3>主外观配置</h3>
        </div>
      </div>
      <p class="muted">{{ store.playerCosmeticsConfig?.knifeConfigPath || '选择目录后读取' }}</p>
      <textarea v-model="knifeConfig" class="config-textarea" spellcheck="false" :disabled="store.busy || !store.selectedRoot" />
    </article>

    <article class="card command-panel">
      <div class="section-head">
        <div>
          <p class="eyebrow">Weapon Presets</p>
          <h3>枪械外观配置</h3>
        </div>
      </div>
      <p class="muted">{{ store.playerCosmeticsConfig?.gunConfigPath || '选择目录后读取' }}</p>
      <textarea v-model="gunConfig" class="config-textarea" spellcheck="false" :disabled="store.busy || !store.selectedRoot" />
    </article>
  </section>
</template>
