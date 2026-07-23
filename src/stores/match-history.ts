import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { invoke } from '@tauri-apps/api/core'
import { useCs2Store } from './cs2'

export interface MatchRecord {
  version: number
  timestamp: string
  map: string
  duration: number
  maxRounds: number
  score: { ct: number; t: number }
  players: PlayerMatchStats[]
  rounds: RoundRecord[]
}

export interface PlayerMatchStats {
  name: string
  steamId?: number
  isBot: boolean
  kills: number
  deaths: number
  assists: number
  damage: number
  hsKills: number
  firstKills: number
  multi2k: number
  multi3k: number
  multi4k: number
  multi5k: number
  clutch1v1: number
  clutch1v2: number
  clutch1v3: number
  clutch1v4: number
  clutch1v5: number
  mvpCount: number
  roundsPlayed: number
  roundsSurvived: number
  roundsWithKill: number
  rating: number
  adr: number
  kdRatio: number
  hsPercent: number
  multiKillCount: number
  clutchCount: number
}

export interface RoundRecord {
  round: number
  winner: string
  reason: string
  roundKills: Record<string, number>
}

export const useMatchHistoryStore = defineStore('match-history', () => {
  const matches = ref<MatchRecord[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const sortedMatches = computed(() =>
    [...matches.value].sort((a, b) => b.timestamp.localeCompare(a.timestamp))
  )

  const totalMatches = computed(() => matches.value.length)

  const averageRating = computed(() => {
    if (matches.value.length === 0) return 0
    const all = matches.value.flatMap(m => m.players)
    return all.length > 0
      ? all.reduce((s, p) => s + p.rating, 0) / all.length
      : 0
  })

  const totalKills = computed(() =>
    matches.value.reduce((s, m) => s + m.players.reduce((ss, p) => ss + p.kills, 0), 0)
  )

  async function loadHistory() {
    const cs2 = useCs2Store()
    const root = cs2.selectedRoot
    if (!root) {
      error.value = 'No CS2 directory selected'
      return
    }

    loading.value = true
    error.value = null

    try {
      const files = await invoke<string[]>('list_match_history', { rootPath: root })

      const loaded: MatchRecord[] = []
      for (const file of files.slice(0, 200)) {
        try {
          const content = await invoke<string>('read_match_history', { rootPath: root, filename: file })
          const record = JSON.parse(content) as MatchRecord
          loaded.push(record)
        } catch {
          // skip corrupt files
        }
      }
      matches.value = loaded
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to load history'
    } finally {
      loading.value = false
    }
  }

  function getMatchByIndex(index: number): MatchRecord | undefined {
    return sortedMatches.value[index]
  }

  function getPlayerHistory(name: string): PlayerMatchStats[] {
    return matches.value
      .map(m => m.players.find(p => p.name === name))
      .filter((p): p is PlayerMatchStats => p !== undefined)
  }

  return {
    matches,
    loading,
    error,
    sortedMatches,
    totalMatches,
    averageRating,
    totalKills,
    loadHistory,
    getMatchByIndex,
    getPlayerHistory,
  }
})
