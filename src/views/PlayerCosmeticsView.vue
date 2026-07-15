<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'

import InlineNotice from '@/components/ui/InlineNotice.vue'
import { getBotItemsState, getDropKnivesState, saveDropKnivesState, setBotItemsState } from '@/services/tauri/cs2'
import { useCs2Store } from '@/stores/cs2'
import type { BotItemsState, DropKnivesState, KnifePreset, PlayerCosmeticsPatch, PlayerCosmeticsState } from '@/types/cs2'

type Tab = 'cosmetics' | 'drop' | 'bot'
type CatalogItem = { id: string; name: string; image?: string }

const store = useCs2Store()
const tab = ref<Tab>('cosmetics')
const loading = ref(false)
const loadError = ref('')
const message = ref('')
const search = ref('')
const selectedWeapon = ref('500')
const catalog = ref<CatalogItem[]>([])
const catalogLoading = ref(false)
const drop = ref<DropKnivesState>({ bindKey: '\\', selected: [], cfgPresent: false, cs2Running: false })
const botItems = ref<BotItemsState>({ skins: false, profiles: false, agents: false, music: false, cfgPresent: false, cs2Running: false })

const current = computed<PlayerCosmeticsState | null>(() => store.playerCosmeticsConfig)
const isReady = computed(() => Boolean(current.value?.pluginPresent))
const isReadOnly = computed(() => Boolean(current.value?.cs2Running))
const visibleCatalog = computed(() => {
  const keyword = search.value.trim().toLowerCase()
  return catalog.value.filter((item) => !keyword || item.name.toLowerCase().includes(keyword) || item.id.includes(keyword)).slice(0, 120)
})
const knifeCatalog = computed(() => catalog.value.filter((item) => Number(item.id) >= 500 && Number(item.id) <= 526))
const emptyPreset = (): KnifePreset => ({ paint: 0, seed: 0, wear: 0, nameTag: '', stattrakEnabled: false, stattrakCount: 0, souvenirEnabled: false })
const editingPreset = computed<KnifePreset>(() => current.value?.presets[selectedWeapon.value] ?? current.value?.gunPresets[selectedWeapon.value] ?? emptyPreset())

function editablePatch(): PlayerCosmeticsPatch | null {
  const state = current.value
  if (!state) return null
  return {
    enabled: state.enabled, applyToHumanPlayers: state.applyToHumanPlayers, applyOnPickup: state.applyOnPickup,
    defaultKnifeDefindex: state.defaultKnifeDefindex, presets: { ...state.presets }, gunPresets: { ...state.gunPresets },
    musicKitId: state.musicKitId, glove: { ...state.glove },
  }
}

function applyLocalPatch(patch: PlayerCosmeticsPatch) {
  if (current.value) store.playerCosmeticsConfig = { ...current.value, ...patch }
}

async function loadCatalog() {
  if (catalog.value.length || catalogLoading.value) return
  catalogLoading.value = true
  try {
    const [namesModule, imagesModule] = await Promise.all([
      import('@/features/player-cosmetics/data/skinNames.json'),
      import('@/features/player-cosmetics/data/skinImages.json'),
    ])
    const namesByLanguage = namesModule.default as unknown as Record<string, Record<string, string>>
    const names = namesByLanguage.schinese ?? namesByLanguage.english ?? {}
    const images = imagesModule.default as Array<{ weapon_defindex: number; paint: number; image: string }>
    const imageByKey = new Map(images.map((item) => [`${item.weapon_defindex}:${item.paint}`, item.image]))
    catalog.value = Object.entries(names).map(([key, name]) => ({ id: key.split(':')[0] ?? key, name, image: imageByKey.get(key) }))
  } catch (error) {
    loadError.value = store.normalizeError(error)
  } finally {
    catalogLoading.value = false
  }
}

async function load() {
  if (!store.selectedRoot) return
  loading.value = true
  loadError.value = ''
  try {
    const cosmetics = await store.refreshPlayerCosmeticsConfig()
    const [nextDrop, nextBotItems] = await Promise.all([getDropKnivesState(store.selectedRoot), getBotItemsState(store.selectedRoot)])
    drop.value = nextDrop
    botItems.value = nextBotItems
    if (!cosmetics?.pluginPresent) message.value = '未检测到 PlayerKnifeCustomizer。请先重新安装资源包。'
  } catch (error) {
    loadError.value = store.normalizeError(error)
  } finally {
    loading.value = false
  }
}

async function saveCosmetics() {
  const patch = editablePatch()
  if (!patch) return
  try { message.value = (await store.savePlayerCosmetics(patch)).message } catch (error) { message.value = store.normalizeError(error) }
}

function updatePreset(field: keyof KnifePreset, value: string | number | boolean) {
  const patch = editablePatch()
  if (!patch) return
  const preset = { ...editingPreset.value, [field]: value }
  if (Number(selectedWeapon.value) >= 500) patch.presets[selectedWeapon.value] = preset
  else patch.gunPresets[selectedWeapon.value] = preset
  applyLocalPatch(patch)
}

function updatePatch(field: keyof PlayerCosmeticsPatch, value: boolean | number) {
  const patch = editablePatch()
  if (!patch) return
  Object.assign(patch, { [field]: value })
  applyLocalPatch(patch)
}

function toggleKnife(id: number) { drop.value.selected = drop.value.selected.includes(id) ? drop.value.selected.filter((item) => item !== id) : [...drop.value.selected, id] }
async function saveDrop() { try { message.value = (await saveDropKnivesState(store.selectedRoot, drop.value)).message } catch (error) { message.value = store.normalizeError(error) } }
async function saveBotItems() { try { botItems.value = await setBotItemsState(store.selectedRoot, botItems.value); message.value = '已保存本助手的 BOT 物品偏好。此操作不会修改游戏或插件配置。' } catch (error) { message.value = store.normalizeError(error) } }

onMounted(() => { void loadCatalog(); if (store.selectedRoot) void load() })
</script>

<template>
  <section class="page-grid cosmetics-page">
    <article class="hero-banner">
      <div><p class="eyebrow">PlayerKnifeCustomizer</p><h3>玩家饰品</h3><p class="muted">结构化管理刀具、手套、枪械、音乐盒和掉落刀具。CS2 运行时全部改为只读。</p></div>
      <div class="actions-row"><button class="ghost-button" type="button" :disabled="loading || store.busy || !store.selectedRoot" @click="load">重新读取</button><button class="primary-button" type="button" :disabled="loading || store.busy || !isReady || isReadOnly" @click="saveCosmetics">保存个人饰品</button></div>
    </article>

    <article v-if="!store.selectedRoot" class="card command-panel cosmetics-state"><h3>先选择 CS2 目录</h3><p class="muted">选择目录后才能读取 PlayerKnifeCustomizer、掉落刀具配置和本地 BOT 物品偏好。</p><RouterLink class="primary-button" to="/install">前往准备环境</RouterLink></article>
    <article v-else-if="loading" class="card command-panel cosmetics-state" aria-busy="true"><div class="skeleton-line skeleton-line--title" /><div class="skeleton-line" /><div class="skeleton-line" /></article>
    <article v-else-if="loadError" class="card command-panel cosmetics-state"><h3>读取玩家饰品失败</h3><p class="muted">{{ loadError }}</p><button class="primary-button" type="button" :disabled="store.busy" @click="load">重新读取</button></article>
    <article v-else-if="!isReady" class="card command-panel cosmetics-state"><h3>未安装 PlayerKnifeCustomizer</h3><p class="muted">当前资源中未找到 PlayerKnifeCustomizer。重新安装资源包后再读取；不会将空状态伪装为可编辑配置。</p><RouterLink class="primary-button" to="/install">重新安装资源包</RouterLink></article>
    <template v-else>
      <InlineNotice v-if="isReadOnly" message="CS2 正在运行，当前内容仅供查看。退出游戏后重新读取才能编辑和保存。" state="warn" />
      <InlineNotice v-else-if="message" :message="message" :state="message.includes('失败') || message.includes('无效') ? 'warn' : 'info'" />
      <div class="segmented-control" aria-label="玩家饰品页面"><button type="button" :data-active="tab === 'cosmetics'" @click="tab = 'cosmetics'">个人饰品</button><button type="button" :data-active="tab === 'drop'" @click="tab = 'drop'">掉落刀具</button><button type="button" :data-active="tab === 'bot'" @click="tab = 'bot'">BOT 物品</button></div>

      <article v-if="tab === 'cosmetics'" class="card command-panel">
        <div class="section-head"><div><p class="eyebrow">个人饰品</p><h3>刀具、枪械、手套与音乐盒</h3></div><span class="status-pill" :data-state="isReadOnly ? 'warn' : 'ready'">{{ isReadOnly ? '只读' : '可保存' }}</span></div>
        <div class="settings-toggle-row"><div><strong>启用玩家饰品</strong><p class="muted">仅用于本地 Bot 训练环境。</p></div><button class="switch-button" type="button" role="switch" :aria-checked="current?.enabled ?? false" :disabled="isReadOnly" @click="updatePatch('enabled', !(current?.enabled ?? false))"><span /></button></div>
        <div class="settings-toggle-row"><div><strong>拾取时应用</strong><p class="muted">拾取符合条件的物品时应用预设。</p></div><button class="switch-button" type="button" role="switch" :aria-checked="current?.applyOnPickup ?? false" :disabled="isReadOnly" @click="updatePatch('applyOnPickup', !(current?.applyOnPickup ?? false))"><span /></button></div>
        <label class="field search-field"><span>搜索完整武器、刀具或皮肤目录</span><input v-model="search" type="search" placeholder="例如 蝴蝶、AK、AWP 或编号" @focus="loadCatalog" /></label>
        <p v-if="catalogLoading" class="muted">正在加载完整饰品目录...</p>
        <div class="quick-chip-grid cosmetics-catalog"><button v-for="item in visibleCatalog" :key="`${item.id}-${item.name}`" class="quick-option" type="button" :data-active="selectedWeapon === item.id" :disabled="isReadOnly" @click="selectedWeapon = item.id"><img v-if="item.image" :src="item.image" alt="" loading="lazy" /><span>{{ item.name }}</span></button></div>
        <div class="form-grid"><label class="field"><span>饰品编号</span><input :value="editingPreset.paint" type="number" min="0" :disabled="isReadOnly" @input="updatePreset('paint', Number(($event.target as HTMLInputElement).value))" /></label><label class="field"><span>磨损 (0-1)</span><input :value="editingPreset.wear" type="number" min="0" max="1" step="0.01" :disabled="isReadOnly" @input="updatePreset('wear', Number(($event.target as HTMLInputElement).value))" /></label><label class="field"><span>种子 (0-1000)</span><input :value="editingPreset.seed" type="number" min="0" max="1000" :disabled="isReadOnly" @input="updatePreset('seed', Number(($event.target as HTMLInputElement).value))" /></label><label class="field"><span>名称标签</span><input :value="editingPreset.nameTag" maxlength="20" :disabled="isReadOnly" @input="updatePreset('nameTag', ($event.target as HTMLInputElement).value)" /></label></div>
        <div class="settings-toggle-row"><strong>StatTrak</strong><button class="switch-button" type="button" role="switch" :aria-checked="editingPreset.stattrakEnabled" :disabled="isReadOnly" @click="updatePreset('stattrakEnabled', !editingPreset.stattrakEnabled)"><span /></button></div>
        <div class="settings-toggle-row"><strong>纪念品</strong><button class="switch-button" type="button" role="switch" :aria-checked="editingPreset.souvenirEnabled" :disabled="isReadOnly" @click="updatePreset('souvenirEnabled', !editingPreset.souvenirEnabled)"><span /></button></div>
        <div class="form-grid"><label class="field"><span>手套编号</span><input :value="current?.glove.defindex ?? 0" type="number" min="4725" max="5035" :disabled="isReadOnly" @input="current && (current.glove.defindex = Number(($event.target as HTMLInputElement).value))" /></label><label class="field"><span>手套饰品编号</span><input :value="current?.glove.paint ?? 0" type="number" min="0" :disabled="isReadOnly" @input="current && (current.glove.paint = Number(($event.target as HTMLInputElement).value))" /></label><label class="field"><span>音乐盒 ID</span><input :value="current?.musicKitId ?? 0" type="number" min="0" max="65535" :disabled="isReadOnly" @input="updatePatch('musicKitId', Number(($event.target as HTMLInputElement).value))" /></label></div>
      </article>

      <article v-else-if="tab === 'drop'" class="card command-panel"><div class="section-head"><div><p class="eyebrow">Drop Knives</p><h3>掉落刀具绑定</h3><p class="muted">只更新助手专属标记块，绝不替换玩家的其他 bind。</p></div><button class="primary-button" type="button" :disabled="store.busy || isReadOnly" @click="saveDrop">保存绑定</button></div><label class="field"><span>按键</span><input v-model="drop.bindKey" maxlength="32" :disabled="isReadOnly" /></label><div class="quick-chip-grid"><button v-for="item in knifeCatalog" :key="item.id" class="quick-option" type="button" :data-active="drop.selected.includes(Number(item.id))" :disabled="isReadOnly" @click="toggleKnife(Number(item.id))"><img v-if="item.image" :src="item.image" alt="" loading="lazy" /><span>{{ item.name }}</span></button></div></article>
      <article v-else class="card command-panel"><div class="section-head"><div><p class="eyebrow">BOT Items</p><h3>BOT 物品偏好</h3><p class="muted">与 Plus 相同：这些开关仅保存本助手本地偏好，不会改变游戏或插件配置。</p></div><button class="primary-button" type="button" :disabled="store.busy || isReadOnly" @click="saveBotItems">保存偏好</button></div><div v-for="item in [['skins', '皮肤'], ['profiles', '档案'], ['agents', '探员'], ['music', '音乐盒']] as const" :key="item[0]" class="settings-toggle-row"><strong>{{ item[1] }}</strong><button class="switch-button" type="button" role="switch" :aria-checked="botItems[item[0]]" :disabled="isReadOnly" @click="botItems[item[0]] = !botItems[item[0]]"><span /></button></div></article>
    </template>
  </section>
</template>
