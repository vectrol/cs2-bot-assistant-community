import commandLibraryData from './cs2-command-library.generated.json'
import commandLibraryManifestData from './cs2-command-library.manifest.json'

export type Cs2CommandRiskLevel = '普通' | '开发/隐藏' | '谨慎' | '启动项'

export type Cs2CommandCategory =
  | '常用/精选'
  | 'Bot 与训练'
  | '对局规则'
  | '服务器'
  | '画面/HUD/准星'
  | '声音'
  | '输入/绑定'
  | '网络/性能'
  | 'Demo/GOTV'
  | '地图/工坊'
  | '开发/调试'
  | '启动项'
  | '未分类'

export type Cs2CommandLibraryItem = {
  name: string
  flags: string[]
  flagsText: string
  descriptionOriginal: string
  descriptionZh: string
  hasReliableZh: boolean
  category: Cs2CommandCategory
  riskLevel: Cs2CommandRiskLevel
  copyWithoutSemicolon: boolean
  source: {
    repo: string
    path: string
    ref: string
    license: string
    url: string
    line: number
  }
}

export type Cs2CommandLibraryManifest = {
  generatedAt: string
  source: {
    repo: string
    path: string
    ref: string
    license: string
    url: string
    rawSha256: string
    rawLines: number
    rawSize: number
  }
  total: number
  duplicateCount: number
  supplementalCount: number
  missingDescriptionCount: number
  missingReliableZhCount: number
  categories: Record<string, number>
  riskLevels: Record<string, number>
}

export const cs2CommandLibrary = commandLibraryData as Cs2CommandLibraryItem[]
export const cs2CommandLibraryManifest = commandLibraryManifestData as Cs2CommandLibraryManifest

export const cs2CommandCategories: Cs2CommandCategory[] = [
  '常用/精选',
  'Bot 与训练',
  '对局规则',
  '服务器',
  '画面/HUD/准星',
  '声音',
  '输入/绑定',
  '网络/性能',
  'Demo/GOTV',
  '地图/工坊',
  '开发/调试',
  '启动项',
  '未分类',
]
