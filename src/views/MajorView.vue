<script setup lang="ts">
import { computed, ref, watch } from 'vue'

type MajorTab = 'stage1' | 'stage2' | 'stage3' | 'playoffs' | 'teams'
type MatchFormat = 'Bo1' | 'Bo3' | 'Bo5'

interface MajorTeam {
  id: string
  name: string
  logo: string
  seed: number
}

interface MajorMatch {
  id: string
  round: number
  group: string
  format: MatchFormat
  teamA?: MajorTeam
  teamB?: MajorTeam
  winnerId?: string
  note: string
}

interface StoredMajorState {
  activeTab?: MajorTab
  teams?: MajorTeam[]
  winners?: Record<string, string>
  notes?: Record<string, string>
  scores?: Record<string, string[]>
}

const STORAGE_KEY = 'cs2-major-predictor-state-v1'

const tabs: Array<{ id: MajorTab; label: string }> = [
  { id: 'stage1', label: '第一阶段' },
  { id: 'stage2', label: '第二阶段' },
  { id: 'stage3', label: '第三阶段' },
  { id: 'playoffs', label: '冠军淘汰赛' },
  { id: 'teams', label: '选择队伍' },
]

const defaultTeamNames = [
  'Vitality',
  'Natus Vincere',
  'Falcons',
  'FUT',
  'Spirit',
  'Astralis',
  'The MongolZ',
  'PVISION',
  'Aurora',
  'FURIA',
  'MOUZ',
  'G2',
  'Legacy',
  'GamerLegion',
  '3DMAX',
  'B8',
  'paiN',
  'Monte',
  '9z',
  'HEROIC',
  'FaZe',
  'BB',
  'BIG',
  'M80',
  'NIP',
  'Alliance',
  'MIBR',
  'EYEBALLERS',
  'Wildcard',
  'SINNERS',
  'Nemesis',
  'FOKUS',
]

const defaultTeamLogos: Record<string, string> = {
  Vitality: 'https://img.majors.im/logos/2511_cs2_budapest/vita.png',
  'Natus Vincere': 'https://img.majors.im/logos/2511_cs2_budapest/navi.png',
  Falcons: 'https://img.majors.im/logos/2511_cs2_budapest/falc.png',
  Spirit: 'https://img.majors.im/logos/2511_cs2_budapest/spir.png',
  Astralis: 'https://img.majors.im/logos/2511_cs2_budapest/astr.png',
  'The MongolZ': 'https://img.majors.im/logos/2511_cs2_budapest/mong.png',
  PVISION: 'https://img.majors.im/logos/2511_cs2_budapest/pv.png',
  Aurora: 'https://img.majors.im/logos/2511_cs2_budapest/auro.png',
  FURIA: 'https://img.majors.im/logos/2511_cs2_budapest/furi.png',
  MOUZ: 'https://img.majors.im/logos/2511_cs2_budapest/mouz.png',
  G2: 'https://img.majors.im/logos/2511_cs2_budapest/g2.png',
  Legacy: 'https://img.majors.im/logos/2511_cs2_budapest/lega.png',
  GamerLegion: 'https://img.majors.im/logos/2511_cs2_budapest/gl.png',
  B8: 'https://img.majors.im/logos/2511_cs2_budapest/b8.png',
  paiN: 'https://img.majors.im/logos/2511_cs2_budapest/pain.png',
  FaZe: 'https://img.majors.im/logos/2511_cs2_budapest/faze.png',
  M80: 'https://img.majors.im/logos/2511_cs2_budapest/m80.png',
  NIP: 'https://img.majors.im/logos/2511_cs2_budapest/nip.png',
  MIBR: 'https://img.majors.im/logos/2511_cs2_budapest/mibr.png',
}

const stored = loadStoredState()
const teams = ref<MajorTeam[]>(normalizeTeams(stored.teams))
const activeTab = ref<MajorTab>(stored.activeTab ?? 'teams')
const winners = ref<Record<string, string>>(stored.winners ?? {})
const notes = ref<Record<string, string>>(stored.notes ?? {})
const scores = ref<Record<string, string[]>>(stored.scores ?? {})

const stage1 = computed(() => buildSwissStage('stage1', teams.value.slice(16, 32), 'Bo1'))
const stage2 = computed(() =>
  buildSwissStage('stage2', [...teams.value.slice(8, 16), ...stage1.value.qualified], 'Bo1'),
)
const stage3 = computed(() =>
  buildSwissStage('stage3', [...teams.value.slice(0, 8), ...stage2.value.qualified], 'Bo3'),
)
const playoffs = computed(() => buildPlayoffs(stage3.value.qualified))

watch(
  [activeTab, teams, winners, notes, scores],
  () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        activeTab: activeTab.value,
        teams: teams.value,
        winners: winners.value,
        notes: notes.value,
        scores: scores.value,
      }),
    )
  },
  { deep: true },
)

function loadStoredState(): StoredMajorState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as StoredMajorState) : {}
  } catch {
    return {}
  }
}

function normalizeTeams(savedTeams?: MajorTeam[]) {
  const source = Array.isArray(savedTeams) && savedTeams.length === 32 ? savedTeams : []

  return defaultTeamNames.map((name, index) => {
    const saved = source[index]
    return {
      id: saved?.id || `team-${index + 1}`,
      name: saved?.name || name,
      logo: saved?.logo || defaultTeamLogos[saved?.name || name] || defaultTeamLogos[name] || '',
      seed: index + 1,
    }
  })
}

function resetTeams() {
  teams.value = normalizeTeams()
  winners.value = {}
  notes.value = {}
  scores.value = {}
}

function updateWinner(match: MajorMatch, teamId?: string) {
  if (!teamId) {
    delete winners.value[match.id]
    return
  }

  winners.value[match.id] = teamId
}

function updateNote(matchId: string, value: string) {
  if (!value.trim()) {
    delete notes.value[matchId]
    return
  }

  notes.value[matchId] = value
}

function updateScore(match: MajorMatch, index: number, value: string) {
  const nextScores = [...(scores.value[match.id] ?? defaultScores(match.format))]
  nextScores[index] = value
  const normalizedScores = nextScores.map((score) => score.trim())

  if (normalizedScores.every((score) => score.length === 0)) {
    delete scores.value[match.id]
    return
  }

  scores.value[match.id] = normalizedScores
}

function scoreRows(format: MatchFormat) {
  if (format === 'Bo1') {
    return 1
  }
  if (format === 'Bo3') {
    return 3
  }
  return 5
}

function minimumScoreRows(format: MatchFormat) {
  if (format === 'Bo1') {
    return 1
  }
  if (format === 'Bo3') {
    return 2
  }
  return 3
}

function defaultScores(format: MatchFormat) {
  return Array.from({ length: scoreRows(format) }, () => '')
}

function scorePlaceholder(format: MatchFormat, index: number) {
  return index < minimumScoreRows(format) ? `第 ${index + 1} 图比分` : `第 ${index + 1} 图比分，可空`
}

function buildSwissStage(stageId: 'stage1' | 'stage2' | 'stage3', stageTeams: MajorTeam[], earlyFormat: MatchFormat) {
  const seededTeams = sortTeams(stageTeams).slice(0, 16)
  const records = new Map(seededTeams.map((team) => [team.id, { wins: 0, losses: 0 }]))
  const rounds: Array<{ label: string; matches: MajorMatch[] }> = []

  for (let round = 1; round <= 5; round += 1) {
    const activeTeams = seededTeams.filter((team) => {
      const record = records.get(team.id)
      return record && record.wins < 3 && record.losses < 3
    })
    const groups = groupByRecord(activeTeams, records)
    const roundMatches: MajorMatch[] = []

    for (const [recordLabel, groupTeams] of groups) {
      const matches = pairTeams(groupTeams).map(([teamA, teamB], index) => {
        const willDecide = isDecider(records.get(teamA.id)?.wins ?? 0, records.get(teamA.id)?.losses ?? 0)
        const format = stageId === 'stage3' || willDecide ? 'Bo3' : earlyFormat
        return createMatch(stageId, round, recordLabel, index, format, teamA, teamB)
      })
      roundMatches.push(...matches)
    }

    for (const match of roundMatches) {
      const winnerId = getWinner(match)
      const loserId = winnerId === match.teamA?.id ? match.teamB?.id : match.teamA?.id
      if (!winnerId || !loserId) {
        continue
      }

      const winnerRecord = records.get(winnerId)
      const loserRecord = records.get(loserId)
      if (winnerRecord) {
        winnerRecord.wins += 1
      }
      if (loserRecord) {
        loserRecord.losses += 1
      }
    }

    rounds.push({ label: `第 ${round} 轮`, matches: roundMatches })
  }

  const finalTeams = seededTeams
    .map((team) => ({ team, record: records.get(team.id) ?? { wins: 0, losses: 0 } }))
    .sort((a, b) => b.record.wins - a.record.wins || a.record.losses - b.record.losses || a.team.seed - b.team.seed)

  return {
    rounds,
    qualified: finalTeams.filter((item) => item.record.wins >= 3).map((item) => item.team).slice(0, 8),
    standings: finalTeams,
  }
}

function groupByRecord(teamsToGroup: MajorTeam[], records: Map<string, { wins: number; losses: number }>) {
  const groups = new Map<string, MajorTeam[]>()
  for (const team of teamsToGroup) {
    const record = records.get(team.id)
    const key = `${record?.wins ?? 0}-${record?.losses ?? 0}`
    groups.set(key, [...(groups.get(key) ?? []), team])
  }

  return [...groups.entries()]
    .sort(([a], [b]) => recordSort(a, b))
    .map(([label, groupTeams]) => [label, sortTeams(groupTeams)] as const)
}

function pairTeams(groupTeams: MajorTeam[]) {
  const pairs: Array<[MajorTeam, MajorTeam]> = []
  const half = Math.floor(groupTeams.length / 2)
  for (let index = 0; index < half; index += 1) {
    const teamA = groupTeams[index]
    const teamB = groupTeams[groupTeams.length - 1 - index]
    if (teamA && teamB) {
      pairs.push([teamA, teamB])
    }
  }
  return pairs
}

function createMatch(
  stageId: string,
  round: number,
  group: string,
  index: number,
  format: MatchFormat,
  teamA: MajorTeam,
  teamB: MajorTeam,
): MajorMatch {
  const id = `${stageId}-r${round}-${group}-${teamA.id}-${teamB.id}-${index}`
  return {
    id,
    round,
    group,
    format,
    teamA,
    teamB,
    winnerId: winners.value[id],
    note: notes.value[id] ?? '',
  }
}

function isDecider(wins: number, losses: number) {
  return wins === 2 || losses === 2
}

function getWinner(match: MajorMatch) {
  if (match.winnerId) {
    return match.winnerId
  }

  return match.teamA && match.teamB ? strongerTeam(match.teamA, match.teamB).id : undefined
}

function strongerTeam(teamA: MajorTeam, teamB: MajorTeam) {
  return teamA.seed < teamB.seed ? teamA : teamB
}

function sortTeams(teamList: MajorTeam[]) {
  return [...teamList].sort((a, b) => a.seed - b.seed)
}

function recordSort(left: string, right: string) {
  const [leftWins, leftLosses] = parseRecord(left)
  const [rightWins, rightLosses] = parseRecord(right)
  return rightWins - leftWins || leftLosses - rightLosses
}

function parseRecord(record: string): [number, number] {
  const [wins = '0', losses = '0'] = record.split('-')
  return [Number(wins), Number(losses)]
}

function buildPlayoffs(playoffTeams: MajorTeam[]) {
  const seededTeams = sortTeams(playoffTeams).slice(0, 8)
  const quarterPairs: Array<[number, number]> = [
    [0, 7],
    [3, 4],
    [1, 6],
    [2, 5],
  ]
  const quarterfinals = quarterPairs.map(([left, right], index) =>
    createPlayoffMatch('playoffs-qf', index + 1, '0-0', 'Bo3', seededTeams[left], seededTeams[right]),
  )
  const semifinalTeams = quarterfinals.map((match) => winnerTeam(match)).filter(Boolean) as MajorTeam[]
  const semifinals = [
    createPlayoffMatch('playoffs-sf', 1, '1-0', 'Bo3', semifinalTeams[0], semifinalTeams[1]),
    createPlayoffMatch('playoffs-sf', 2, '1-0', 'Bo3', semifinalTeams[2], semifinalTeams[3]),
  ]
  const finalistTeams = semifinals.map((match) => winnerTeam(match)).filter(Boolean) as MajorTeam[]
  const finals = [createPlayoffMatch('playoffs-final', 1, '2-0', 'Bo5', finalistTeams[0], finalistTeams[1])]
  const champion = winnerTeam(finals[0])

  return {
    rounds: [
      { label: '八强赛', matches: quarterfinals },
      { label: '半决赛', matches: semifinals },
      { label: '决赛', matches: finals },
    ],
    results: [
      { title: '冠军', teams: champion ? [champion] : [] },
      { title: '亚军', teams: finalistTeams.filter((team) => team.id !== champion?.id) },
      { title: '四强', teams: semifinalTeams.filter((team) => !finalistTeams.some((finalist) => finalist.id === team.id)) },
      { title: '八强', teams: seededTeams.filter((team) => !semifinalTeams.some((semifinalist) => semifinalist.id === team.id)) },
    ],
  }
}

function createPlayoffMatch(
  idPrefix: string,
  round: number,
  group: string,
  format: MatchFormat,
  teamA?: MajorTeam,
  teamB?: MajorTeam,
): MajorMatch {
  const id = `${idPrefix}-${round}-${teamA?.id ?? 'empty-a'}-${teamB?.id ?? 'empty-b'}`
  return {
    id,
    round,
    group,
    format,
    teamA,
    teamB,
    winnerId: winners.value[id],
    note: notes.value[id] ?? '',
  }
}

function winnerTeam(match?: MajorMatch) {
  if (!match?.teamA || !match.teamB) {
    return undefined
  }

  const winnerId = getWinner(match)
  return winnerId === match.teamA.id ? match.teamA : match.teamB
}

function stageByTab(tab: MajorTab) {
  if (tab === 'stage1') {
    return stage1.value
  }
  if (tab === 'stage2') {
    return stage2.value
  }
  return stage3.value
}

function incomingLabel(tab: MajorTab) {
  if (tab === 'stage1') {
    return '第 17-32 种子进入第一阶段'
  }
  if (tab === 'stage2') {
    return '第 9-16 种子 + 第一阶段 8 支晋级队'
  }
  return '第 1-8 种子 + 第二阶段 8 支晋级队，全部 Bo3'
}
</script>

<template>
  <section class="page-grid major-page">
    <article class="hero-banner major-hero">
      <div>
        <p class="eyebrow">Major 预测</p>
        <h2>记录 32 队强度、瑞士轮赛果和冠军淘汰赛。</h2>
      </div>
      <span class="status-badge" data-state="ready">本地自动保存</span>
    </article>

    <div class="major-tabs" role="tablist" aria-label="Major 页面">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        class="major-tab"
        :data-active="activeTab === tab.id"
        type="button"
        @click="activeTab = tab.id"
      >
        {{ tab.label }}
      </button>
    </div>

    <article v-if="activeTab === 'teams'" class="card">
      <div class="section-head">
        <div>
          <p class="eyebrow">选择队伍</p>
          <h3>32 支队伍和强度顺序</h3>
          <p class="muted">从上到下默认越来越弱。队标可以留空，不影响预测。</p>
        </div>
        <button class="ghost-button" type="button" @click="resetTeams">恢复默认</button>
      </div>

      <div class="major-team-grid">
        <label v-for="team in teams" :key="team.id" class="major-team-row">
          <span class="major-seed">{{ team.seed }}</span>
          <input v-model="team.name" type="text" :aria-label="`第 ${team.seed} 名队伍名称`" />
          <input v-model="team.logo" type="text" placeholder="队标 URL，可空" :aria-label="`${team.name} 队标`" />
        </label>
      </div>
    </article>

    <article v-else-if="activeTab !== 'playoffs'" class="card major-board-card">
      <div class="section-head">
        <div>
          <p class="eyebrow">{{ incomingLabel(activeTab) }}</p>
          <h3>{{ tabs.find((tab) => tab.id === activeTab)?.label }}赛果预测</h3>
        </div>
        <span class="status-badge" data-state="warn">
          {{ activeTab === 'stage3' ? '全场 Bo3' : '晋级 / 淘汰局 Bo3' }}
        </span>
      </div>

      <div class="major-swiss-board">
        <section v-for="round in stageByTab(activeTab).rounds" :key="round.label" class="major-round">
          <h4>{{ round.label }}</h4>
          <div class="major-match-list">
            <article v-for="match in round.matches" :key="match.id" class="major-match">
              <div class="major-match__head">
                <span>{{ match.group }} ({{ match.format }})</span>
                <small>备注</small>
              </div>
              <div class="major-side-list">
                <button
                  v-for="team in [match.teamA, match.teamB]"
                  :key="team?.id"
                  class="major-side"
                  :data-winner="team?.id === getWinner(match)"
                  type="button"
                  :disabled="!team"
                  @click="updateWinner(match, team?.id)"
                >
                  <span class="major-logo">
                    <img v-if="team?.logo" :src="team.logo" alt="" />
                    <span v-else>{{ team?.name.slice(0, 2).toUpperCase() }}</span>
                  </span>
                  <strong>{{ team?.name || '待定' }}</strong>
                  <small>#{{ team?.seed || '-' }}</small>
                </button>
              </div>
              <div class="major-score-grid" :data-format="match.format">
                <input
                  v-for="(_, scoreIndex) in defaultScores(match.format)"
                  :key="`${match.id}-score-${scoreIndex}`"
                  :value="scores[match.id]?.[scoreIndex] ?? ''"
                  type="text"
                  :placeholder="scorePlaceholder(match.format, scoreIndex)"
                  :aria-label="`${match.teamA?.name || '待定'} 对 ${match.teamB?.name || '待定'} ${scorePlaceholder(match.format, scoreIndex)}`"
                  @input="updateScore(match, scoreIndex, ($event.target as HTMLInputElement).value)"
                />
              </div>
              <textarea
                :value="notes[match.id] ?? ''"
                rows="2"
                placeholder="添加本场备注"
                @input="updateNote(match.id, ($event.target as HTMLTextAreaElement).value)"
              />
            </article>
          </div>
        </section>

        <section class="major-round major-final">
          <h4>晋级结果</h4>
          <div class="major-standing-list">
            <div v-for="item in stageByTab(activeTab).standings" :key="item.team.id" class="major-standing">
              <span>#{{ item.team.seed }}</span>
              <strong>{{ item.team.name }}</strong>
              <small>{{ item.record.wins }}-{{ item.record.losses }}</small>
            </div>
          </div>
        </section>
      </div>
    </article>

    <article v-else class="card major-board-card">
      <div class="section-head">
        <div>
          <p class="eyebrow">冠军淘汰赛</p>
          <h3>8 强单败预测</h3>
        </div>
        <span class="status-badge" data-state="warn">决赛 Bo5</span>
      </div>

      <div class="major-playoff-board">
        <section v-for="round in playoffs.rounds" :key="round.label" class="major-round">
          <h4>{{ round.label }}</h4>
          <div class="major-match-list">
            <article v-for="match in round.matches" :key="match.id" class="major-match">
              <div class="major-match__head">
                <span>{{ match.format }}</span>
                <small>备注</small>
              </div>
              <div class="major-side-list">
                <button
                  v-for="(team, teamIndex) in [match.teamA, match.teamB]"
                  :key="team?.id || `${match.id}-empty-${teamIndex}`"
                  class="major-side"
                  :data-winner="team?.id === getWinner(match)"
                  type="button"
                  :disabled="!team"
                  @click="updateWinner(match, team?.id)"
                >
                  <span class="major-logo">
                    <img v-if="team?.logo" :src="team.logo" alt="" />
                    <span v-else>{{ team?.name.slice(0, 2).toUpperCase() || '--' }}</span>
                  </span>
                  <strong>{{ team?.name || '等待上一轮' }}</strong>
                  <small>#{{ team?.seed || '-' }}</small>
                </button>
              </div>
              <div class="major-score-grid" :data-format="match.format">
                <input
                  v-for="(_, scoreIndex) in defaultScores(match.format)"
                  :key="`${match.id}-score-${scoreIndex}`"
                  :value="scores[match.id]?.[scoreIndex] ?? ''"
                  type="text"
                  :placeholder="scorePlaceholder(match.format, scoreIndex)"
                  :aria-label="`${match.teamA?.name || '待定'} 对 ${match.teamB?.name || '待定'} ${scorePlaceholder(match.format, scoreIndex)}`"
                  @input="updateScore(match, scoreIndex, ($event.target as HTMLInputElement).value)"
                />
              </div>
              <textarea
                :value="notes[match.id] ?? ''"
                rows="2"
                placeholder="添加本场备注"
                @input="updateNote(match.id, ($event.target as HTMLTextAreaElement).value)"
              />
            </article>
          </div>
        </section>

        <section class="major-round major-final">
          <h4>最终结果</h4>
          <div class="major-standing-list">
            <div v-for="result in playoffs.results" :key="result.title" class="major-result-group">
              <strong>{{ result.title }}</strong>
              <div v-for="team in result.teams" :key="team.id" class="major-standing">
                <span>#{{ team.seed }}</span>
                <span>{{ team.name }}</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </article>
  </section>
</template>
