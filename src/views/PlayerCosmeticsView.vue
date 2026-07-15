<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import InlineNotice from '@/components/ui/InlineNotice.vue'
import { getBotItemsState, getDropKnivesState, saveDropKnivesState, setBotItemsState } from '@/services/tauri/cs2'
import { useCs2Store } from '@/stores/cs2'
import type { BotItemsState, DropKnivesState, KnifePreset, PlayerCosmeticsPatch } from '@/types/cs2'

const store = useCs2Store()
const tab = ref<'cosmetics' | 'drop' | 'bot'>('cosmetics')
const message = ref('')
const search = ref('')
const selectedWeapon = ref('500')
const drop = ref<DropKnivesState>({ bindKey: '\\', selected: [], cfgPresent: false, cs2Running: false })
const botItems = ref<BotItemsState>({ skins: false, profiles: false, agents: false, music: false, cfgPresent: false, cs2Running: false })
const weaponOptions = [
  ['500', '刺刀'], ['503', '爪子刀'], ['505', '折叠刀'], ['507', '卡拉姆比特'], ['508', 'M9 刺刀'], ['515', '蝴蝶刀'], ['516', '短剑'], ['522', '短剑'],
  ['7', 'AK-47'], ['16', 'M4A4'], ['60', 'M4A1-S'], ['9', 'AWP'], ['4', 'Glock-18'], ['61', 'USP-S'],
] as const
const knifeOptions = weaponOptions.filter(([id]) => Number(id) >= 500)
const visibleOptions = computed(() => weaponOptions.filter(([, name]) => name.includes(search.value.trim()) || !search.value.trim()))
const current = computed(() => store.playerCosmeticsConfig)
const editingPreset = computed<KnifePreset>(() => current.value?.presets[selectedWeapon.value] ?? current.value?.gunPresets[selectedWeapon.value] ?? {
  paint: 0, seed: 0, wear: 0, nameTag: '', stattrakEnabled: false, stattrakCount: 0, souvenirEnabled: false,
})

function patchFromCurrent(): PlayerCosmeticsPatch {
  const state = current.value
  return state ? {
    enabled: state.enabled, applyToHumanPlayers: state.applyToHumanPlayers, applyOnPickup: state.applyOnPickup,
    defaultKnifeDefindex: state.defaultKnifeDefindex, presets: { ...state.presets }, gunPresets: { ...state.gunPresets },
    musicKitId: state.musicKitId, glove: { ...state.glove },
  } : { enabled: true, applyToHumanPlayers: true, applyOnPickup: false, defaultKnifeDefindex: 0, presets: {}, gunPresets: {}, musicKitId: 0, glove: { enabled: false, defindex: 0, paint: 0, seed: 0, wear: 0 } }
}

async function load() {
  try {
    await store.refreshPlayerCosmeticsConfig()
    if (!store.selectedRoot) return
    ;[drop.value, botItems.value] = await Promise.all([getDropKnivesState(store.selectedRoot), getBotItemsState(store.selectedRoot)])
    message.value = '已读取 PlayerKnifeCustomizer 与 Plus 本地偏好状态。'
  } catch (error) { message.value = store.normalizeError(error) }
}

async function saveCosmetics() {
  try { message.value = (await store.savePlayerCosmetics(patchFromCurrent())).message } catch (error) { message.value = store.normalizeError(error) }
}

function updatePreset(field: keyof KnifePreset, value: string | number | boolean) {
  const patch = patchFromCurrent()
  const preset = { ...editingPreset.value, [field]: value }
  if (Number(selectedWeapon.value) >= 500) patch.presets[selectedWeapon.value] = preset
  else patch.gunPresets[selectedWeapon.value] = preset
  store.playerCosmeticsConfig = { ...current.value!, ...patch }
}

function toggleKnife(id: number) {
  drop.value.selected = drop.value.selected.includes(id) ? drop.value.selected.filter((item) => item !== id) : [...drop.value.selected, id]
}

async function saveDrop() { try { message.value = (await saveDropKnivesState(store.selectedRoot, drop.value)).message } catch (error) { message.value = store.normalizeError(error) } }
async function saveBotItems() { try { botItems.value = await setBotItemsState(store.selectedRoot, botItems.value); message.value = '已保存本助手的 BOT 物品偏好状态。该状态不会修改游戏或插件配置。' } catch (error) { message.value = store.normalizeError(error) } }

onMounted(() => { if (store.selectedRoot) void load() })
</script>

<template>
  <section class="page-grid cosmetics-page">
    <article class="hero-banner">
      <div><p class="eyebrow">PlayerKnifeCustomizer</p><h3>玩家饰品</h3><p class="muted">刀具、手套、枪械、音乐盒与掉落刀具使用结构化配置；CS2 运行时不能写入。</p></div>
      <div class="actions-row"><button class="ghost-button" type="button" :disabled="store.busy || !store.selectedRoot" @click="load">重新读取</button><button class="primary-button" type="button" :disabled="store.busy || !current?.pluginPresent || current.cs2Running" @click="saveCosmetics">保存个人饰品</button></div>
    </article>
    <InlineNotice v-if="message" :message="message" :state="message.includes('无效') || message.includes('运行') || message.includes('失败') ? 'warn' : 'info'" />
    <div class="segmented-control" aria-label="玩家饰品页面">
      <button type="button" :data-active="tab === 'cosmetics'" @click="tab = 'cosmetics'">个人饰品</button><button type="button" :data-active="tab === 'drop'" @click="tab = 'drop'">掉落刀具</button><button type="button" :data-active="tab === 'bot'" @click="tab = 'bot'">BOT 物品</button>
    </div>
    <template v-if="tab === 'cosmetics'">
      <article class="card command-panel">
        <div class="section-head"><div><p class="eyebrow">个人饰品</p><h3>预设编辑</h3></div><span class="status-pill" :data-state="current?.pluginPresent ? 'ready' : 'warn'">{{ current?.pluginPresent ? '插件可用' : '未检测到插件' }}</span></div>
        <div class="settings-toggle-row"><div><strong>启用玩家饰品</strong><p class="muted">仅在本地 Bot 训练环境使用。</p></div><button class="switch-button" type="button" role="switch" :aria-checked="current?.enabled" @click="current && (current.enabled = !current.enabled)"><span /></button></div>
        <label class="field search-field"><span>搜索武器或刀具</span><input v-model="search" type="search" placeholder="例如 蝴蝶、AK、AWP" /></label>
        <div class="quick-chip-grid"><button v-for="[id, name] in visibleOptions" :key="id" class="quick-option" type="button" :data-active="selectedWeapon === id" @click="selectedWeapon = id">{{ name }}</button></div>
        <div class="form-grid">
          <label class="field"><span>饰品编号</span><input :value="editingPreset.paint" type="number" min="0" @input="updatePreset('paint', Number(($event.target as HTMLInputElement).value))" /></label>
          <label class="field"><span>磨损 (0-1)</span><input :value="editingPreset.wear" type="number" min="0" max="1" step="0.01" @input="updatePreset('wear', Number(($event.target as HTMLInputElement).value))" /></label>
          <label class="field"><span>种子 (0-1000)</span><input :value="editingPreset.seed" type="number" min="0" max="1000" @input="updatePreset('seed', Number(($event.target as HTMLInputElement).value))" /></label>
          <label class="field"><span>名称标签</span><input :value="editingPreset.nameTag" maxlength="20" @input="updatePreset('nameTag', ($event.target as HTMLInputElement).value)" /></label>
        </div>
        <div class="settings-toggle-row"><div><strong>StatTrak</strong></div><button class="switch-button" type="button" role="switch" :aria-checked="editingPreset.stattrakEnabled" @click="updatePreset('stattrakEnabled', !editingPreset.stattrakEnabled)"><span /></button></div>
        <div class="settings-toggle-row"><div><strong>纪念品</strong></div><button class="switch-button" type="button" role="switch" :aria-checked="editingPreset.souvenirEnabled" @click="updatePreset('souvenirEnabled', !editingPreset.souvenirEnabled)"><span /></button></div>
      </article>
      <article class="card command-panel"><div class="section-head"><div><p class="eyebrow">Glove / Music</p><h3>手套与音乐盒</h3></div></div><div class="form-grid"><label class="field"><span>手套编号</span><input v-model.number="current!.glove.defindex" type="number" min="4725" max="5035" /></label><label class="field"><span>手套饰品编号</span><input v-model.number="current!.glove.paint" type="number" min="0" /></label><label class="field"><span>音乐盒 ID</span><input v-model.number="current!.musicKitId" type="number" min="0" max="65535" /></label></div></article>
    </template>
    <article v-else-if="tab === 'drop'" class="card command-panel"><div class="section-head"><div><p class="eyebrow">Drop Knives</p><h3>掉落刀具绑定</h3><p class="muted">只更新本助手专用标记块，不会删除或替换你的其他按键绑定。</p></div><button class="primary-button" type="button" :disabled="!store.selectedRoot || drop.cs2Running" @click="saveDrop">保存绑定</button></div><label class="field"><span>按键</span><input v-model="drop.bindKey" maxlength="32" /></label><div class="quick-chip-grid"><button v-for="[id, name] in knifeOptions" :key="id" class="quick-option" :data-active="drop.selected.includes(Number(id))" type="button" @click="toggleKnife(Number(id))">{{ name }}</button></div></article>
    <article v-else class="card command-panel"><div class="section-head"><div><p class="eyebrow">BOT Items</p><h3>BOT 物品偏好</h3><p class="muted">与 Plus 相同：四个开关只保存本助手的本地偏好，不会改变 BOT 外观或写入游戏/插件配置。</p></div><button class="primary-button" type="button" :disabled="!store.selectedRoot" @click="saveBotItems">保存偏好</button></div><div v-for="item in [['skins', '皮肤'], ['profiles', '档案'], ['agents', '探员'], ['music', '音乐盒']] as const" :key="item[0]" class="settings-toggle-row"><strong>{{ item[1] }}</strong><button class="switch-button" type="button" role="switch" :aria-checked="botItems[item[0]]" @click="botItems[item[0]] = !botItems[item[0]]"><span /></button></div></article>
  </section>
</template>
