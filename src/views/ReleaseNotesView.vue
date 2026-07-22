<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'

import CollapsiblePanel from '@/components/CollapsiblePanel.vue'
import SummaryStrip from '@/components/SummaryStrip.vue'
import { releaseNoteEntries } from '@/features/release-notes/data'
import type { ReleaseNoteEntry } from '@/features/release-notes/data'
import type { SoftwareRelease } from '@/features/software-updates/types'
import { fetchSoftwareReleaseHistory } from '@/services/software-updates'
import { openExternalUrl } from '@/services/tauri/app'

const { t } = useI18n()

const openMessage = ref('')
const cloudEntries = ref<ReleaseNoteEntry[] | null>(null)
const cloudStatus = ref<'loading' | 'online' | 'builtin' | 'failed' | 'not-configured'>('loading')
const entries = computed(() => {
  if (!cloudEntries.value?.length) {
    return [...releaseNoteEntries].sort(compareReleaseNotes)
  }

  const mergedByVersion = new Map<string, ReleaseNoteEntry>()
  cloudEntries.value.forEach((cloudEntry) => {
    mergedByVersion.set(cloudEntry.version, cloudEntry)
  })
  releaseNoteEntries.forEach((localEntry) => {
    if (!mergedByVersion.has(localEntry.version)) {
      mergedByVersion.set(localEntry.version, localEntry)
    }
  })

  return [...mergedByVersion.values()].sort(compareReleaseNotes)
})
const entrySourceLabel = computed(() => {
  const key = {
    failed: 'sourceFailed',
    'not-configured': 'sourceNotConfigured',
    loading: 'sourceLoading',
    builtin: 'sourceBuiltin',
    online: 'sourceOnline',
  }[cloudStatus.value] || 'sourceOnline'
  return t(`releaseNotes.${key}`)
})
const latestEntry = computed(() => entries.value[0] ?? null)
const historyEntries = computed(() => entries.value.slice(1))
const summaryItems = computed(() => [
  {
    label: t('releaseNotes.latestVersion'),
    value: latestEntry.value ? `v${latestEntry.value.version}` : t('releaseNotes.none'),
    state: latestEntry.value ? 'ready' as const : 'warn' as const,
  },
  {
    label: t('releaseNotes.logSource'),
    value: entrySourceLabel.value,
    state: cloudStatus.value === 'failed' || cloudStatus.value === 'not-configured' ? 'warn' as const : 'ready' as const,
  },
  {
    label: t('releaseNotes.historyCount'),
    value: `${historyEntries.value.length} ${t('releaseNotes.count')}`,
    state: 'ready' as const,
  },
])

onMounted(async () => {
  const result = await fetchSoftwareReleaseHistory()
  if (result.status === 'online') {
    cloudEntries.value = result.payload.history.map(mapCloudRelease)
    cloudStatus.value = 'online'
    return
  }
  if (result.status === 'empty') {
    cloudEntries.value = []
    cloudStatus.value = 'builtin'
    return
  }
  cloudStatus.value = result.status
})

function compareReleaseNotes(left: ReleaseNoteEntry, right: ReleaseNoteEntry) {
  const versionCompare = compareVersions(right.version, left.version)
  if (versionCompare !== 0) {
    return versionCompare
  }
  return right.date.localeCompare(left.date)
}

function compareVersions(left: string, right: string) {
  const leftParts = left.split('.').map((part) => Number.parseInt(part, 10) || 0)
  const rightParts = right.split('.').map((part) => Number.parseInt(part, 10) || 0)
  const length = Math.max(leftParts.length, rightParts.length)
  for (let index = 0; index < length; index += 1) {
    const diff = (leftParts[index] ?? 0) - (rightParts[index] ?? 0)
    if (diff !== 0) {
      return diff
    }
  }
  return 0
}

function mapCloudRelease(release: SoftwareRelease): ReleaseNoteEntry {
  const entry: ReleaseNoteEntry = {
    version: release.version,
    date: release.publishedAt ? release.publishedAt.slice(0, 10) : '',
    title: release.title || `v${release.version} 更新`,
    summary: release.summary || '',
    items: release.items.length
      ? release.items.map((text) => ({ text }))
      : [{ text: release.summary || '这个版本已经可以下载。' }],
  }

  if (release.download?.url) {
    entry.source = {
      label: release.download.label || '打开夸克网盘',
      url: release.download.url,
    }
  }

  return entry
}

async function openLink(url: string) {
  try {
    await openExternalUrl(url)
    openMessage.value = ''
  } catch {
    openMessage.value = '打开外部链接失败，请稍后手动访问。'
  }
}
</script>

<template>
  <section class="page-grid">
    <article class="hero-banner">
      <div>
        <p class="eyebrow">{{ t('releaseNotes.title') }}</p>
        <h2>{{ t('releaseNotes.description') }}</h2>
      </div>
      <div class="hero-status">
        <RouterLink class="ghost-button" to="/settings">
          {{ t('releaseNotes.backToSettings') }}
        </RouterLink>
        <span class="status-badge" data-state="ready">最新版本 v{{ latestEntry?.version }}</span>
      </div>
    </article>

    <SummaryStrip :items="summaryItems" />

    <p v-if="openMessage" class="message-line">{{ openMessage }}</p>

    <article v-if="latestEntry" class="card release-entry">
      <div class="section-head">
        <div>
          <p class="eyebrow">{{ latestEntry.date }}</p>
          <h3>v{{ latestEntry.version }} · {{ latestEntry.title }}</h3>
        </div>
        <button
          v-if="latestEntry.source"
          class="ghost-button"
          type="button"
          @click="openLink(latestEntry.source.url)"
        >
          {{ latestEntry.source.label }}
        </button>
      </div>

      <p class="muted">{{ latestEntry.summary }}</p>

      <div class="release-list">
        <p v-for="item in latestEntry.items" :key="item.text">
          <span>{{ item.text }}</span>
          <template v-if="item.links">
            <button
              v-for="link in item.links"
              :key="link.url"
              class="inline-link-button"
              type="button"
              @click="openLink(link.url)"
            >
              {{ link.label }}
            </button>
          </template>
        </p>
      </div>
    </article>

    <div class="release-timeline">
      <CollapsiblePanel
        v-for="entry in historyEntries"
        :key="entry.version"
        :title="`v${entry.version} · ${entry.title}`"
        :subtitle="entry.summary"
        :badge="entry.date"
      >
        <div class="section-head">
          <button
            v-if="entry.source"
            class="ghost-button"
            type="button"
            @click="openLink(entry.source.url)"
          >
            {{ entry.source.label }}
          </button>
        </div>

        <div class="release-list">
          <p v-for="item in entry.items" :key="item.text">
            <span>{{ item.text }}</span>
            <template v-if="item.links">
              <button
                v-for="link in item.links"
                :key="link.url"
                class="inline-link-button"
                type="button"
                @click="openLink(link.url)"
              >
                {{ link.label }}
              </button>
            </template>
          </p>
        </div>
      </CollapsiblePanel>
    </div>
  </section>
</template>
