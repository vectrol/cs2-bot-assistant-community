<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import CollapsiblePanel from '@/components/CollapsiblePanel.vue'
import SummaryStrip from '@/components/SummaryStrip.vue'
import { releaseNoteEntries } from '@/features/release-notes/data'
import type { ReleaseNoteEntry } from '@/features/release-notes/data'
import type { SoftwareRelease } from '@/features/software-updates/types'
import { fetchSoftwareUpdates } from '@/services/software-updates'
import { openExternalUrl } from '@/services/tauri/app'

const openMessage = ref('')
const cloudEntries = ref<ReleaseNoteEntry[] | null>(null)
const localEntriesByVersion = computed(() => new Map(releaseNoteEntries.map((entry) => [entry.version, entry])))
const entries = computed(() => {
  if (!cloudEntries.value?.length) {
    return releaseNoteEntries
  }

  const mergedEntries = cloudEntries.value.map((cloudEntry) => {
    const localEntry = localEntriesByVersion.value.get(cloudEntry.version)
    if (!localEntry) {
      return cloudEntry
    }

    return {
      ...localEntry,
      source: cloudEntry.source ?? localEntry.source,
    }
  })

  const cloudVersions = new Set(cloudEntries.value.map((entry) => entry.version))
  const localOnlyEntries = releaseNoteEntries.filter((entry) => !cloudVersions.has(entry.version))
  return [...mergedEntries, ...localOnlyEntries]
})
const latestEntry = computed(() => entries.value[0] ?? null)
const historyEntries = computed(() => entries.value.slice(1))
const summaryItems = computed(() => [
  {
    label: '最新版本',
    value: latestEntry.value ? `v${latestEntry.value.version}` : '暂无',
    state: latestEntry.value ? 'ready' as const : 'warn' as const,
  },
  {
    label: '日志来源',
    value: cloudEntries.value?.length ? '线上记录' : '内置记录',
    state: 'ready' as const,
  },
  {
    label: '历史版本',
    value: `${historyEntries.value.length} 条`,
    state: 'ready' as const,
  },
])

onMounted(async () => {
  const payload = await fetchSoftwareUpdates()
  if (payload?.history?.length) {
    cloudEntries.value = payload.history.map(mapCloudRelease)
  }
})

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
        <p class="eyebrow">更新日志</p>
        <h2>查看每个版本具体更新了什么。</h2>
      </div>
      <div class="hero-status">
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
