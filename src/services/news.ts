import type { NewsFeed } from '@/features/news/types'

const NEWS_FETCH_TIMEOUT_MS = 10000

export async function fetchNewsFeed(): Promise<NewsFeed | null> {
  const feedUrl = import.meta.env.VITE_NEWS_FEED_URL as string | undefined
  if (!feedUrl) {
    return null
  }

  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), NEWS_FETCH_TIMEOUT_MS)

  try {
    const response = await fetch(feedUrl, {
      cache: 'no-store',
      signal: controller.signal,
    })

    if (!response.ok) {
      return null
    }

    return (await response.json()) as NewsFeed
  } catch {
    return null
  } finally {
    window.clearTimeout(timeout)
  }
}
