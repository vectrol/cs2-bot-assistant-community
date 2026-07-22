<script setup lang="ts">
import { inject } from 'vue'
import { useI18n } from 'vue-i18n'

import { openInventoryWindow } from '@/services/tauri/app'

const { t } = useI18n()
const openLaunchModal = inject<() => void>('openLaunchGameModal')

const features = [
  { icon: '🔫', title: '皮肤浏览', desc: '浏览所有武器皮肤，支持筛选和预览。' },
  { icon: '📦', title: '开箱模拟', desc: '模拟开箱，查看所有武器箱的掉落物。' },
  { icon: '🏷', title: '贴纸应用', desc: '在武器上预览和搭配贴纸位置。' },
  { icon: '✏', title: '物品改名', desc: '自定义武器名称和描述标签。' },
  { icon: '☁', title: 'Steam 同步', desc: '同步你的 Steam 库存进行搭配。' },
  { icon: '📋', title: '库存管理', desc: '管理创建的预设和搭配方案。' },
]

const configItems = [
  { key: 'invsim_url', desc: '库存模拟器服务地址' },
  { key: 'invsim_apikey', desc: 'API 密钥' },
  { key: 'invsim_ws_enabled', desc: '启用 WebSocket 实时同步' },
  { key: 'invsim_ws_cooldown', desc: 'WebSocket 冷却时间 (秒)' },
]
</script>

<template>
  <section class="page-grid inventory-page">
    <article class="hero-banner inventory-hero">
      <div>
        <p class="eyebrow">{{ t('nav.inventory') }}</p>
        <h2>CS2 库存模拟器</h2>
        <p class="muted">{{ t('inventory.hint') }}</p>
      </div>
      <div class="inventory-hero__actions">
        <button class="primary-button" type="button" @click="openInventoryWindow()">
          打开库存模拟器
        </button>
        <button class="ghost-button" type="button" @click="openLaunchModal?.()">
          启动 CS2
        </button>
      </div>
    </article>

    <div class="inventory-features">
      <article
        v-for="f in features"
        :key="f.title"
        class="feature-card"
      >
        <span class="feature-card__icon">{{ f.icon }}</span>
        <h3>{{ f.title }}</h3>
        <p class="muted">{{ f.desc }}</p>
      </article>
    </div>

    <article class="card inventory-config">
      <div class="section-head">
        <div>
          <p class="eyebrow">插件配置</p>
          <h3>CounterStrikeSharp 配置项</h3>
        </div>
      </div>
      <div class="config-grid">
        <div v-for="item in configItems" :key="item.key" class="config-row">
          <code>{{ item.key }}</code>
          <span class="muted">{{ item.desc }}</span>
        </div>
      </div>
      <p class="muted config-note">以上配置项位于 <code>game/csgo/addons/counterstrikesharp/configs/plugins/InventorySimulator/</code></p>
    </article>
  </section>
</template>

<style scoped>
.inventory-page {
  padding: 1rem;
}

.inventory-hero {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 1rem;
}

.inventory-hero__actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.inventory-features {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 0.75rem;
  margin: 1.5rem 0;
}

.feature-card {
  background: var(--panel-bg);
  border: 1px solid var(--panel-border);
  border-radius: var(--radius-md);
  padding: 1rem;
  text-align: center;
  transition: box-shadow 0.2s, border-color 0.2s;
}

.feature-card:hover {
  box-shadow: var(--elevation-1);
  border-color: var(--accent);
}

.feature-card__icon {
  font-size: 2rem;
  display: block;
  margin-bottom: 0.5rem;
}

.feature-card h3 {
  margin: 0 0 0.25rem;
  font-size: var(--fs-sm);
}

.inventory-config {
  margin-top: 0.5rem;
}

.config-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 0.5rem;
  margin: 0.75rem 0;
}

.config-row {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  padding: 0.5rem 0.75rem;
  background: var(--ghost-bg);
  border-radius: var(--radius-sm);
  font-size: var(--fs-sm);
}

.config-row code {
  font-family: var(--font-mono);
  color: var(--accent-text, var(--accent));
}

.config-note {
  font-size: var(--fs-xs);
  margin-top: 0.75rem;
}

.config-note code {
  font-family: var(--font-mono);
  font-size: var(--fs-xs);
}
</style>
