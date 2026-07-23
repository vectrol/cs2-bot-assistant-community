<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useMatchHistoryStore } from '@/stores/match-history'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const store = useMatchHistoryStore()

const index = computed(() => Number(route.params.index))
const match = computed(() => store.sortedMatches[index.value])

const sortedPlayers = computed(() =>
  match.value
    ? [...match.value.players].sort((a, b) => b.rating - a.rating)
    : []
)

const maxRating = computed(() =>
  sortedPlayers.value.length > 0 ? Math.max(...sortedPlayers.value.map(p => p.rating), 1) : 1
)

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString()
}

function barWidth(rating: number): string {
  return `${(rating / maxRating.value) * 100}%`
}

onMounted(() => {
  if (store.sortedMatches.length === 0) {
    store.loadHistory()
  }
})
</script>

<template>
  <section class="page-grid" v-if="match">
    <article class="hero-banner glass">
      <div class="hero-banner__top">
        <button class="ghost-button" type="button" @click="router.push('/match-history')">
          &larr; {{ t('matchHistory.back') }}
        </button>
        <h2>{{ match.map }}</h2>
        <div class="match-score">
          <span :class="match.score.ct > match.score.t ? 'winner' : ''">{{ match.score.ct }}</span>
          <span class="match-score-divider">:</span>
          <span :class="match.score.t > match.score.ct ? 'winner' : ''">{{ match.score.t }}</span>
        </div>
        <p class="muted">{{ formatDate(match.timestamp) }} · {{ formatDuration(match.duration) }}</p>
      </div>
    </article>

    <div class="players-table-wrap">
      <table class="players-table">
        <thead>
          <tr>
            <th>{{ t('matchHistory.player') }}</th>
            <th>K</th>
            <th>D</th>
            <th>A</th>
            <th>ADR</th>
            <th>HS%</th>
            <th>FK</th>
            <th>2K</th>
            <th>3K</th>
            <th>4K</th>
            <th>5K</th>
            <th>1vX</th>
            <th>MVP</th>
            <th>Rating</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in sortedPlayers" :key="p.name">
            <td class="player-name">
              <span v-if="p.isBot" class="bot-tag">BOT</span>
              {{ p.name }}
            </td>
            <td class="num">{{ p.kills }}</td>
            <td class="num">{{ p.deaths }}</td>
            <td class="num">{{ p.assists }}</td>
            <td class="num">{{ p.adr.toFixed(1) }}</td>
            <td class="num">{{ p.hsPercent.toFixed(0) }}%</td>
            <td class="num">{{ p.firstKills }}</td>
            <td class="num">{{ p.multi2k }}</td>
            <td class="num">{{ p.multi3k }}</td>
            <td class="num">{{ p.multi4k }}</td>
            <td class="num">{{ p.multi5k }}</td>
            <td class="num">{{ p.clutchCount }}</td>
            <td class="num">{{ p.mvpCount }}</td>
            <td class="num rating-cell">
              <span :class="p.rating >= 1.5 ? 'rating-high' : p.rating >= 1.0 ? '' : 'rating-low'">
                {{ p.rating.toFixed(2) }}
              </span>
            </td>
            <td class="bar-cell">
              <div class="rating-bar" :style="{ width: barWidth(p.rating) }" />
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="summary-grid">
      <div class="summary-card glass">
        <p class="eyebrow">{{ t('matchHistory.kills') }}</p>
        <p class="summary-value">{{ match.players.reduce((s, p) => s + p.kills, 0) }}</p>
      </div>
      <div class="summary-card glass">
        <p class="eyebrow">{{ t('matchHistory.deaths') }}</p>
        <p class="summary-value">{{ match.players.reduce((s, p) => s + p.deaths, 0) }}</p>
      </div>
      <div class="summary-card glass">
        <p class="eyebrow">{{ t('matchHistory.topRating') }}</p>
        <p class="summary-value accent">{{ Math.max(...match.players.map(p => p.rating)).toFixed(2) }}</p>
      </div>
      <div class="summary-card glass">
        <p class="eyebrow">{{ t('matchHistory.totalDamage') }}</p>
        <p class="summary-value">{{ match.players.reduce((s, p) => s + p.damage, 0) }}</p>
      </div>
    </div>
  </section>

  <section v-else class="empty-state">
    <p class="muted">{{ t('matchHistory.notFound') }}</p>
    <RouterLink to="/match-history" class="ghost-button">{{ t('matchHistory.back') }}</RouterLink>
  </section>
</template>

<style scoped>
.page-grid {
  padding: 1rem;
}

.hero-banner {
  padding: 1.25rem;
}

.hero-banner__top {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.match-score {
  font-size: var(--fs-2xl);
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.match-score .winner {
  color: var(--accent);
}

.match-score-divider {
  color: var(--text-muted);
}

.players-table-wrap {
  overflow-x: auto;
  margin-top: 1rem;
  border-radius: var(--radius-lg);
  border: 1px solid var(--panel-border);
}

.players-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--fs-sm);
  font-variant-numeric: tabular-nums;
}

.players-table th {
  padding: 0.5rem 0.4rem;
  text-align: center;
  font-weight: 600;
  color: var(--text-muted);
  border-bottom: 1px solid var(--panel-border);
  white-space: nowrap;
  background: var(--ghost-bg);
  position: sticky;
  top: 0;
}

.players-table td {
  padding: 0.45rem 0.4rem;
  text-align: center;
  border-bottom: 1px solid var(--glass-border);
}

.players-table tr:last-child td {
  border-bottom: none;
}

.players-table tr:hover {
  background: var(--ghost-bg);
}

.player-name {
  text-align: left !important;
  font-weight: 500;
  white-space: nowrap;
}

.bot-tag {
  display: inline-block;
  font-size: 0.65rem;
  font-weight: 700;
  color: var(--text-muted);
  background: var(--ghost-bg);
  padding: 0.1rem 0.3rem;
  border-radius: 3px;
  margin-right: 0.3rem;
  vertical-align: middle;
}

.num {
  font-variant-numeric: tabular-nums;
}

.rating-cell {
  font-weight: 600;
}

.rating-high {
  color: var(--accent);
}

.rating-low {
  color: var(--text-muted);
}

.bar-cell {
  width: 80px;
  padding-right: 0.75rem !important;
}

.rating-bar {
  height: 6px;
  background: var(--accent);
  border-radius: 3px;
  opacity: 0.4;
  min-width: 2px;
  transition: width 0.3s ease;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 0.75rem;
  margin-top: 1rem;
}

.summary-card {
  padding: 1rem;
  text-align: center;
  border-radius: var(--radius-lg);
}

.summary-value {
  font-size: var(--fs-xl);
  font-weight: 700;
  margin: 0;
}

.summary-value.accent {
  color: var(--accent);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 3rem;
}
</style>
