export interface NewsArticle {
  id: string
  title: string
  summary: string
  url: string
  source: string
  imageUrl?: string
  publishedAt: string
  category?: string
}

export interface MatchSchedule {
  id: string
  team1: string
  team2: string
  tournament: string
  date: string
  format?: string
  score1?: number
  score2?: number
  status: 'upcoming' | 'live' | 'finished'
}

export interface NewsFeed {
  articles: NewsArticle[]
  matches: MatchSchedule[]
  fetchedAt: string
}
