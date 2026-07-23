<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import { fetchNewsFeed } from '@/services/news'
import type { NewsArticle, MatchSchedule } from '@/features/news/types'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const articles = ref<NewsArticle[]>([])
const matches = ref<MatchSchedule[]>([])
const loading = ref(true)

onMounted(async () => {
  const feed = await fetchNewsFeed()
  articles.value = feed.articles
  matches.value = feed.matches
  loading.value = false
})

function matchStatusLabel(status: MatchSchedule['status']) {
  const map: Record<MatchSchedule['status'], string> = {
    upcoming: t('news.upcoming'),
    live: t('news.live'),
    finished: t('news.finished'),
  }
  return map[status]
}

function matchStatusState(status: MatchSchedule['status']) {
  const map: Record<MatchSchedule['status'], string> = {
    upcoming: 'info',
    live: 'warn',
    finished: 'ready',
  }
  return map[status]
}

const summaryItems = computed(() => [
  { label: t('news.articlesCount'), value: `${articles.value.length}`, state: 'ready' as const },
  { label: t('news.matchesCount'), value: `${matches.value.length}`, state: 'info' as const },
])

function openUrl(url: string) {
  window.open(url, '_blank')
}
</script>

<template>
  <section class="page-grid news-page">
    <article class="hero-banner news-hero glass" style="animation: fade-in-up 0.25s ease;">
      <div>
        <p class="eyebrow">{{ t('news.title') }}</p>
        <h2>{{ t('news.headline') }}</h2>
        <p class="muted">{{ t('news.description') }}</p>
      </div>
      <div class="dashboard-hero__status">
        <span
          v-for="item in summaryItems"
          :key="item.label"
          class="status-pill"
          :data-state="item.state"
        >
          {{ item.label }}: {{ item.value }}
        </span>
      </div>
    </article>

    <div v-if="loading" class="news-loading">
      <p>{{ t('news.loading') }}</p>
    </div>

    <template v-else>
      <section v-if="matches.length > 0" class="card news-section glass">
        <div class="section-head">
          <div>
            <p class="eyebrow">{{ t('news.matchesTitle') }}</p>
            <h3>{{ t('news.matchesDesc') }}</h3>
          </div>
        </div>
        <div class="matches-grid">
          <article
            v-for="match in matches"
            :key="match.id"
            class="match-card glass"
          >
            <div class="match-teams">
              <span class="match-team">{{ match.team1 }}</span>
              <span class="match-vs">vs</span>
              <span class="match-team">{{ match.team2 }}</span>
            </div>
            <div class="match-meta">
              <span class="match-tournament">{{ match.tournament }}</span>
              <span
                class="status-pill"
                :data-state="matchStatusState(match.status)"
              >
                {{ matchStatusLabel(match.status) }}
              </span>
            </div>
            <p class="match-date muted">{{ match.date }}</p>
          </article>
        </div>
      </section>

      <section v-if="articles.length > 0" class="card news-section glass">
        <div class="section-head">
          <div>
            <p class="eyebrow">{{ t('news.articlesTitle') }}</p>
            <h3>{{ t('news.articlesDesc') }}</h3>
          </div>
        </div>
        <div class="articles-list">
          <article
            v-for="article in articles"
            :key="article.id"
            class="article-card glass"
            @click="openUrl(article.url)"
          >
            <div class="article-content">
              <div>
                <h4>{{ article.title }}</h4>
                <p class="muted">{{ article.summary }}</p>
              </div>
              <div class="article-meta">
                <span class="article-source">{{ article.source }}</span>
                <span class="article-date">{{ article.publishedAt }}</span>
              </div>
            </div>
          </article>
        </div>
      </section>

      <div v-if="articles.length === 0 && matches.length === 0" class="news-empty">
        <p class="muted">{{ t('news.noData') }}</p>
      </div>
    </template>
  </section>
</template>

<style scoped>
.news-page {
  padding: 1rem;
}

.news-hero {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 1rem;
}

.news-loading,
.news-empty {
  text-align: center;
  padding: 3rem 1rem;
}

.news-section {
  padding: 1.25rem;
  margin-top: 1.5rem;
}

.matches-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}

.match-card {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  border-radius: var(--radius-lg);
}

.match-teams {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  font-size: var(--fs-lg);
}

.match-vs {
  opacity: 0.5;
  font-size: var(--fs-sm);
}

.match-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.match-tournament {
  font-size: var(--fs-sm);
  opacity: 0.7;
}

.match-date {
  font-size: var(--fs-xs);
}

.articles-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 1rem;
}

.article-card {
  padding: 1rem;
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.article-card:hover {
  transform: translateY(-1px);
  box-shadow: var(--glass-shadow);
}

.article-content {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.article-content h4 {
  margin: 0 0 0.25rem;
}

.article-meta {
  display: flex;
  gap: 1rem;
  font-size: var(--fs-xs);
  opacity: 0.6;
}

@media (prefers-reduced-motion: reduce) {
  .article-card {
    transition: none;
  }
  .article-card:hover {
    transform: none;
  }
}
</style>
