<script setup lang="ts">
import ConsolePanel from '@/components/layout/ConsolePanel.vue'
import { openInventoryWindow } from '@/services/tauri/app'

function openInBrowser() {
  openInventoryWindow()
}
</script>

<template>
  <section class="page-grid inventory-page">
    <ConsolePanel
      eyebrow="Inventory"
      title="库存模拟器"
      description="CS2 Inventory Simulator by ianlucas — 皮肤预览、开箱、贴纸、改名。在浏览器中打开体验完整功能。"
      tone="strong"
    >
      <template #actions>
        <button class="primary-button" type="button" @click="openInBrowser">
          在浏览器中打开
        </button>
      </template>
    </ConsolePanel>

    <article class="card inventory-hero">
      <div class="inventory-hero__content">
        <p class="eyebrow">CS2 Inventory Simulator</p>
        <h2>inventory.cstrike.app</h2>
        <p class="muted">
          一个完整的 CS2 库存模拟工具，支持武器皮肤、刀具、手套、音乐盒、
          贴纸、探员、开箱、改名等全部功能。
        </p>
        <div class="inventory-hero__features">
          <span>皮肤浏览</span>
          <span>开箱模拟</span>
          <span>贴纸应用</span>
          <span>物品改名</span>
          <span>Steam同步</span>
          <span>库存管理</span>
        </div>
        <button class="primary-button launch-button" type="button" @click="openInBrowser">
          打开库存模拟器
        </button>
      </div>
    </article>

    <article class="card quick-card">
      <div class="section-head">
        <div>
          <p class="eyebrow">Plugin Config</p>
          <h3>CSS 库存插件配置</h3>
        </div>
      </div>
      <p class="muted">
        安装资源包后 CounterStrikeSharp 库存插件自动加载。以下 cvars 可在游戏控制台中使用：
      </p>
      <div class="invsim-cvars">
        <div class="cvar-row"><code>invsim_url</code><span>库存服务地址，默认 inventory.cstrike.app</span></div>
        <div class="cvar-row"><code>invsim_apikey</code><span>API Key（如需同步已登录库存）</span></div>
        <div class="cvar-row"><code>invsim_ws_enabled</code><span>允许玩家使用 !ws 刷新库存 (0/1)</span></div>
        <div class="cvar-row"><code>invsim_ws_cooldown</code><span>!ws 指令冷却时间（秒），默认 30</span></div>
        <div class="cvar-row"><code>!ws</code><span>游戏内刷新库存指令</span></div>
      </div>
    </article>
  </section>
</template>

<style scoped>
.inventory-hero {
  padding: 2.5rem;
  text-align: center;
  background: linear-gradient(135deg, rgba(14, 165, 233, 0.12), rgba(34, 197, 94, 0.06));
  border: 1px solid rgba(14, 165, 233, 0.2);
}

.inventory-hero__content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}

.inventory-hero__content h2 {
  font-size: 1.5rem;
  font-family: var(--font-mono);
  color: var(--accent);
}

.inventory-hero__features {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  justify-content: center;
  margin: 0.5rem 0;
}

.inventory-hero__features span {
  padding: 0.2rem 0.6rem;
  font-size: var(--fs-xs);
  background: var(--ghost-bg);
  border: 1px solid var(--panel-border);
  border-radius: var(--radius-pill);
}

.launch-button {
  margin-top: 0.5rem;
  padding: 0.7rem 2rem;
  font-size: 1rem;
}

.invsim-cvars {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 0.75rem;
}

.cvar-row {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.75rem;
  align-items: baseline;
  padding: 0.375rem 0;
  border-bottom: 1px solid var(--border-muted);
}

.cvar-row code {
  font-family: var(--font-mono);
  font-size: var(--fs-sm);
  color: var(--accent);
  white-space: nowrap;
}

.cvar-row span {
  font-size: var(--fs-sm);
  color: var(--text-muted);
}
</style>
