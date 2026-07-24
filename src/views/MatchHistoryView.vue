<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useMatchHistoryStore } from '@/stores/match-history'
const { t } = useI18n()
const router = useRouter()
const store = useMatchHistoryStore()
const searchQuery = ref('')

const filtered = computed(() => {
  const q = searchQuery.value.toLowerCase()
  return store.sortedMatches
    .filter(m => m.map.toLowerCase().includes(q) || m.players.some(p => p.name.toLowerCase().includes(q)))
    .map(m => ({ match: m, bestPlayer: topPlayer(m.players) }))
})

function topPlayer(players: typeof store.sortedMatches[0]['players']) {
  const sorted = [...players].sort((a, b) => b.rating - a.rating)
  return sorted[0]!
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function viewDetail(index: number) {
  router.push(`/match-history/${index}`)
}

onMounted(() => {
  store.loadHistory()
})
</script>

<template>
  <section class="page-grid">
    <article class="hero-banner glass">
      <div>
        <p class="eyebrow">{{ t('matchHistory.title') }}</p>
        <h2>{{ t('matchHistory.subtitle') }}</h2>
        <p class="muted">{{ store.totalMatches }} matches · {{ t('matchHistory.avgRating') }}: {{ store.averageRating.toFixed(2) }} · {{ store.totalKills }} kills</p>
      </div>
      <label class="search-wrap">
        <span class="sr-only">{{ t('matchHistory.search') }}</span>
        <input v-model="searchQuery" class="search-input" :placeholder="t('matchHistory.search')" />
      </label>
    </article>

    <div v-if="store.loading" class="loading-state">
      <span class="spinner" />
      <span>{{ t('matchHistory.loading') }}</span>
    </div>

    <div v-else-if="store.error" class="empty-state">
      <p class="muted">{{ store.error }}</p>
    </div>

    <div v-else-if="filtered.length === 0" class="empty-state">
      <p class="muted">{{ t('matchHistory.empty') }}</p>
    </div>

    <div v-else class="match-list">
      <button
        v-for="{ match, bestPlayer } in filtered"
        :key="match.timestamp"
        class="match-card glass"
        type="button"
        @click="viewDetail(store.sortedMatches.indexOf(match))"
      >
        <div class="match-card__header">
          <div class="match-card__map">{{ match.map }}</div>
          <div class="match-card__score">
            <span :class="match.score.ct > match.score.t ? 'winner' : ''">{{ match.score.ct }}</span>
            <span class="match-card__score-divider">:</span>
            <span :class="match.score.t > match.score.ct ? 'winner' : ''">{{ match.score.t }}</span>
          </div>
          <div class="match-card__duration">{{ formatDuration(match.duration) }}</div>
        </div>

        <div class="match-card__meta">
          <span class="muted">{{ formatDate(match.timestamp) }}</span>
        </div>

        <div class="match-card__top-player">
          <span class="match-card__top-name">{{ bestPlayer.name }}</span>
          <span class="match-card__top-kd">{{ bestPlayer.kills }}K / {{ bestPlayer.deaths }}D</span>
          <span class="match-card__top-rating">{{ bestPlayer.rating.toFixed(2) }}</span>
          <span class="match-card__top-adr">{{ bestPlayer.adr.toFixed(1) }} ADR</span>
        </div>

        <div class="match-card__players">
          <span v-for="p in match.players.filter(p => !p.isBot).slice(0, 10)" :key="p.name" class="player-tag">{{ p.name }}</span>
        </div>
      </button>
    </div>
  </section>
</template>

<style scoped>
.page-grid {
  padding: 1rem;
}

.hero-banner {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 1rem;
  padding: 1.25rem;
}

.search-wrap {
  flex-shrink: 0;
}

.search-input {
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--panel-border);
  border-radius: var(--radius-sm);
  background: var(--field-bg);
  color: var(--text-color);
  font-size: var(--fs-sm);
  min-width: 220px;
}

.loading-state,
.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 3rem;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid var(--panel-border);
  border-top-color: var(--color-accent);
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.match-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 1rem;
}

.match-card {
  padding: 1rem;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  border-radius: var(--radius-lg);
}

.match-card:hover {
  transform: translateY(-1px);
  box-shadow: var(--glass-shadow);
}

.match-card__header {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.match-card__map {
  font-weight: 600;
  font-size: var(--fs-base);
  min-width: 120px;
}

.match-card__score {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: var(--fs-lg);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.match-card__score .winner {
  color: var(--color-accent);
}

.match-card__score-divider {
  color: var(--muted-color);
  margin: 0 0.15rem;
}

.match-card__duration {
  font-size: var(--fs-xs);
  color: var(--muted-color);
  margin-left: auto;
}

.match-card__meta {
  margin-top: 0.25rem;
  font-size: var(--fs-xs);
}

.match-card__top-player {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: 0.5rem;
  padding: 0.4rem 0.6rem;
  background: var(--ghost-bg);
  border-radius: var(--radius-sm);
  font-size: var(--fs-sm);
}

.match-card__top-name {
  font-weight: 600;
}

.match-card__top-rating {
  color: var(--color-accent);
  font-weight: 600;
}

.match-card__top-adr {
  color: var(--muted-color);
}

.match-card__top-kd {
  color: var(--muted-color);
}

.match-card__players {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  margin-top: 0.5rem;
}

.player-tag {
  font-size: var(--fs-xs);
  padding: 0.15rem 0.4rem;
  border-radius: var(--radius-sm);
  background: var(--ghost-bg);
  color: var(--muted-color);
}
</style>
