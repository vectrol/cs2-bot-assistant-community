import type { NewsFeed } from '@/features/news/types'

const NEWS_FETCH_TIMEOUT_MS = 10000

function builtinFeed(): NewsFeed {
  return {
    articles: [
      {
        id: '1',
        title: 'IEM Cologne 2026 赛程公布',
        summary: 'IEM Cologne 2026 将于七月在德国科隆举行，全球顶尖 CS2 战队将争夺 $1,000,000 总奖金池。',
        url: 'https://www.hltv.org',
        source: 'HLTV',
        imageUrl: '',
        publishedAt: '2026-07-20',
        category: '赛事',
      },
      {
        id: '2',
        title: 'CS2 最新更新：武器平衡调整',
        summary: 'Valve 发布了 CS2 重大更新，对 M4A4、FAMAS 和 Galil 进行了平衡性调整，并修复了多个地图漏洞。',
        url: 'https://www.counter-strike.net',
        source: 'Valve',
        imageUrl: '',
        publishedAt: '2026-07-18',
        category: '更新',
      },
      {
        id: '3',
        title: 'NiKo 达成职业生涯 10,000 击杀',
        summary: 'G2 明星选手 NiKo 在 BLAST Premier 比赛中达成 CS:GO/CS2 生涯 10,000 击杀里程碑，位列历史前列。',
        url: 'https://www.hltv.org',
        source: 'HLTV',
        imageUrl: '',
        publishedAt: '2026-07-15',
        category: '选手',
      },
      {
        id: '4',
        title: 'CS2 创意工坊新地图推荐',
        summary: '本月社区地图精选：de_autumn、de_castle 和 de_lunar 入选，每张地图都有独特的视觉风格和战术深度。',
        url: 'https://steamcommunity.com/workshop',
        source: 'Steam 创意工坊',
        imageUrl: '',
        publishedAt: '2026-07-12',
        category: '社区',
      },
      {
        id: '5',
        title: 'BLAST Premier 秋季赛分组揭晓',
        summary: 'BLAST Premier 2026 秋季赛分组已公布，FaZe、NaVi、Vitality 等 12 支顶级战队将角逐 $425,000 奖金。',
        url: 'https://www.blastpremier.com',
        source: 'BLAST',
        imageUrl: '',
        publishedAt: '2026-07-10',
        category: '赛事',
      },
    ],
    matches: [
      {
        id: 'm1',
        team1: 'FaZe Clan',
        team2: 'NaVi',
        tournament: 'IEM Cologne 2026',
        date: '2026-07-25',
        format: 'BO3',
        status: 'upcoming',
      },
      {
        id: 'm2',
        team1: 'G2 Esports',
        team2: 'Team Spirit',
        tournament: 'IEM Cologne 2026',
        date: '2026-07-25',
        format: 'BO3',
        status: 'upcoming',
      },
      {
        id: 'm3',
        team1: 'Vitality',
        team2: 'MOUZ',
        tournament: 'BLAST Premier Fall',
        date: '2026-07-22',
        format: 'BO3',
        score1: 1,
        score2: 0,
        status: 'live',
      },
      {
        id: 'm4',
        team1: 'Team Liquid',
        team2: 'FURIA',
        tournament: 'ESL Pro League S21',
        date: '2026-07-19',
        format: 'BO3',
        score1: 2,
        score2: 0,
        status: 'finished',
      },
      {
        id: 'm5',
        team1: 'Eternal Fire',
        team2: 'M80',
        tournament: 'ESL Pro League S21',
        date: '2026-07-19',
        format: 'BO3',
        score1: 0,
        score2: 2,
        status: 'finished',
      },
    ],
    fetchedAt: new Date().toISOString(),
  }
}

export async function fetchNewsFeed(): Promise<NewsFeed> {
  const feedUrl = import.meta.env.VITE_NEWS_FEED_URL as string | undefined

  if (feedUrl) {
    const controller = new AbortController()
    const timeout = window.setTimeout(() => controller.abort(), NEWS_FETCH_TIMEOUT_MS)

    try {
      const response = await fetch(feedUrl, {
        cache: 'no-store',
        signal: controller.signal,
      })

      if (response.ok) {
        return (await response.json()) as NewsFeed
      }
    } catch {
    } finally {
      window.clearTimeout(timeout)
    }
  }

  return builtinFeed()
}
