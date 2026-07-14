import { access, mkdir, readFile, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { dirname, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'

const SOURCE_PATH = resolve('scripts/.cache/cs2-cvarlist.md')
const DATA_PATH = resolve('src/features/cs2/cs2-command-library.generated.json')
const MANIFEST_PATH = resolve('src/features/cs2/cs2-command-library.manifest.json')
const SOURCE_META = {
  repo: 'armync/ArminC-CS2-Cvars',
  path: 'cvars/cvarlist.md',
  ref: 'main',
  license: 'CC0-1.0',
  url: 'https://github.com/armync/ArminC-CS2-Cvars/blob/main/cvars/cvarlist.md',
}

const SUPPLEMENTAL_COMMANDS = [
  {
    name: '+attack',
    flags: [],
    descriptionOriginal: 'Pressed state for primary attack.',
    descriptionZh: '按住主开火。',
    category: '输入/绑定',
    riskLevel: '普通',
    copyWithoutSemicolon: false,
  },
  {
    name: '-attack',
    flags: [],
    descriptionOriginal: 'Released state for primary attack.',
    descriptionZh: '松开主开火。',
    category: '输入/绑定',
    riskLevel: '普通',
    copyWithoutSemicolon: false,
  },
  {
    name: '-insecure',
    flags: [],
    descriptionOriginal: 'Steam launch option that disables VAC secure mode for local plugin use.',
    descriptionZh: 'Steam 启动项：允许加载本地插件，不能用于 VAC 安全服务器。',
    category: '启动项',
    riskLevel: '启动项',
    copyWithoutSemicolon: true,
  },
]

const FEATURED_COMMANDS = new Set([
  'bot_kick',
  'bot_add',
  'bot_add_ct',
  'bot_add_t',
  'bot_quota',
  'sv_cheats',
  'mp_restartgame',
  'cl_crosshairsize',
  'cl_crosshaircolor',
  'cl_crosshairgap',
  '+attack',
  '-attack',
  '-insecure',
])

const EXACT_ZH = new Map([
  ['bot_kick', '踢出指定 Bot；不带参数时通常踢出全部 Bot。'],
  ['bot_add', '添加一个 Bot。'],
  ['bot_add_ct', '向 CT 阵营添加一个 Bot。'],
  ['bot_add_t', '向 T 阵营添加一个 Bot。'],
  ['bot_quota', '设置服务器需要保持的 Bot 数量。'],
  ['bot_stop', '让 Bot 停止行动或恢复行动。'],
  ['bot_mimic', '让 Bot 模仿玩家移动和视角，用于测试。'],
  ['sv_cheats', '开启或关闭作弊/调试类命令；很多测试命令需要它启用。'],
  ['mp_restartgame', '在指定秒数后重新开始当前对局。'],
  ['mp_freezetime', '设置回合开始冻结时间。'],
  ['mp_roundtime', '设置普通模式回合时长。'],
  ['mp_buytime', '设置每回合买枪时间。'],
  ['mp_limitteams', '设置两队人数差限制。'],
  ['mp_autoteambalance', '开启或关闭自动平衡队伍。'],
  ['cl_crosshairsize', '设置准星长度。'],
  ['cl_crosshairgap', '设置准星中心间距。'],
  ['cl_crosshairthickness', '设置准星线条粗细。'],
  ['cl_crosshaircolor', '设置准星颜色。'],
  ['cl_showfps', '显示或隐藏 FPS 信息。'],
  ['fps_max', '限制最高帧率。'],
  ['volume', '设置主音量。'],
  ['sensitivity', '设置鼠标灵敏度。'],
  ['bind', '把按键绑定到命令。'],
  ['unbind', '取消指定按键绑定。'],
  ['status', '显示当前服务器、玩家和连接信息。'],
  ['connect', '连接到指定服务器地址。'],
  ['disconnect', '断开当前服务器连接。'],
  ['retry', '重新连接最近的服务器。'],
  ['record', '开始录制 Demo。'],
  ['stop', '停止当前 Demo 录制或播放动作。'],
  ['playdemo', '播放指定 Demo 文件。'],
  ['demoui', '打开 Demo 播放控制界面。'],
  ['map', '加载指定地图。'],
  ['changelevel', '切换到指定地图。'],
  ['workshop_start_map', '启动指定创意工坊地图。'],
  ['+attack', '按住主开火。'],
  ['-attack', '松开主开火。'],
  ['+jump', '按住跳跃。'],
  ['-jump', '松开跳跃。'],
  ['+duck', '按住蹲下。'],
  ['-duck', '松开蹲下。'],
  ['+use', '按住使用键。'],
  ['-use', '松开使用键。'],
  ['-insecure', 'Steam 启动项：允许加载本地插件，不能用于 VAC 安全服务器。'],
  ['-console', 'Steam 启动项：启动游戏时打开控制台。'],
  ['-novid', 'Steam 启动项：跳过启动视频。'],
  ['-fullscreen', 'Steam 启动项：以全屏模式启动。'],
  ['-windowed', 'Steam 启动项：以窗口模式启动。'],
  ['-w', 'Steam 启动项：设置窗口宽度。'],
  ['-h', 'Steam 启动项：设置窗口高度。'],
])

const PREFIX_ZH = [
  [/^bot_/, 'Bot 与训练相关命令。'],
  [/^sv_/, '服务器或作弊/调试环境相关设置。'],
  [/^mp_/, '对局规则、回合流程或比赛参数设置。'],
  [/^cl_crosshair/, '准星外观相关设置。'],
  [/^cl_hud|^hud_/, 'HUD 和界面显示相关设置。'],
  [/^snd_|^voice_|^volume$/, '声音、语音或音量相关设置。'],
  [/^bind$|^unbind$|^\+|^-/, '输入、按键或启动参数相关命令。'],
  [/^net_|^cq_|^rate$|^fps_/, '网络、性能或帧率相关设置。'],
  [/^demo|^playdemo|^record$/, 'Demo/GOTV 录制或播放相关命令。'],
  [/^map$|^changelevel|^workshop_/, '地图加载、换图或创意工坊相关命令。'],
  [/^dev_|^debug_|^vprof_|^ent_|^mat_/, '开发、调试或引擎诊断相关命令，请谨慎使用。'],
]

async function main() {
  await ensureSource()
  const markdown = await readFile(SOURCE_PATH, 'utf8')
  const markdownSha256 = createHash('sha256').update(markdown, 'utf8').digest('hex').toUpperCase()
  const rows = parseTable(markdown)
  const seen = new Map()

  for (const row of rows) {
    const key = row.name.toLowerCase()
    if (!seen.has(key)) {
      seen.set(key, toCommand(row))
    }
  }

  const sourceCommandCount = seen.size

  for (const item of SUPPLEMENTAL_COMMANDS) {
    const key = item.name.toLowerCase()
    if (!seen.has(key)) {
      seen.set(key, {
        ...item,
        flagsText: item.flags.join(', '),
        hasReliableZh: true,
        source: {
          repo: 'cs2-bot-improver-assistant',
          path: 'scripts/build-cs2-command-library.mjs',
          ref: 'local',
          license: 'project',
          url: '',
          line: 0,
        },
      })
    }
  }

  const commands = [...seen.values()].sort((a, b) => a.name.localeCompare(b.name, 'en'))
  const duplicateCount = rows.length - sourceCommandCount
  const missingDescriptionCount = commands.filter((item) => item.descriptionOriginal.length === 0).length
  const missingReliableZhCount = commands.filter((item) => !item.hasReliableZh).length
  const categories = countBy(commands, 'category')
  const riskLevels = countBy(commands, 'riskLevel')

  const manifest = {
    generatedAt: new Date().toISOString(),
    source: {
      ...SOURCE_META,
      rawSha256: markdownSha256,
      rawLines: markdown.split('\n').length,
      rawSize: Buffer.byteLength(markdown, 'utf8'),
    },
    total: commands.length,
    duplicateCount,
    supplementalCount: SUPPLEMENTAL_COMMANDS.length,
    missingDescriptionCount,
    missingReliableZhCount,
    categories,
    riskLevels,
  }

  await mkdir(dirname(DATA_PATH), { recursive: true })
  await writeFile(DATA_PATH, `${JSON.stringify(commands)}\n`, 'utf8')
  await writeFile(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')

  console.log(JSON.stringify(manifest, null, 2))
}

async function ensureSource() {
  try {
    await access(SOURCE_PATH)
  } catch {
    const result = spawnSync(process.execPath, ['scripts/fetch-cs2-cvars.mjs'], {
      cwd: process.cwd(),
      stdio: 'inherit',
    })
    if (result.error) {
      throw result.error
    }
    if (result.status !== 0) {
      throw new Error(`fetch-cs2-cvars failed with exit code ${result.status}`)
    }
  }
}

function parseTable(markdown) {
  const lines = markdown.split(/\r?\n/)
  const rows = []
  for (let index = 2; index < lines.length; index += 1) {
    const line = lines[index]
    if (!line?.trim()) {
      continue
    }
    const parts = line.split('|').map((part) => part.trim())
    if (parts.length < 3) {
      continue
    }
    const [name = '', flags = '', ...descriptionParts] = parts
    const cleanName = name.replace(/`/g, '').trim()
    if (!cleanName) {
      continue
    }
    rows.push({
      name: cleanName,
      flags: flags ? flags.split(',').map((flag) => flag.trim()).filter(Boolean) : [],
      descriptionOriginal: descriptionParts.join('|').trim(),
      line: index + 1,
    })
  }
  return rows
}

function toCommand(row) {
  const description = row.descriptionOriginal
  const name = row.name
  const descriptionZh = translateDescription(name, description)
  const hasReliableZh = descriptionZh !== noReliableDescription(description) && descriptionZh !== noSourceDescription()
  return {
    name,
    flags: row.flags,
    flagsText: row.flags.join(', '),
    descriptionOriginal: description,
    descriptionZh,
    hasReliableZh,
    category: categorize(name, row.flags, description),
    riskLevel: riskLevel(name, row.flags, description),
    copyWithoutSemicolon: name.startsWith('-'),
    source: {
      ...SOURCE_META,
      line: row.line,
    },
  }
}

function translateDescription(name, description) {
  const lowerName = name.toLowerCase()
  if (EXACT_ZH.has(lowerName)) {
    return EXACT_ZH.get(lowerName)
  }
  if (!description.trim()) {
    return noSourceDescription()
  }
  const matched = PREFIX_ZH.find(([pattern]) => pattern.test(lowerName))
  if (matched) {
    return `${matched[1]}源数据说明：${description}`
  }
  return noReliableDescription(description)
}

function noReliableDescription(description) {
  return `暂无可靠中文说明，以下为源数据原文：${description}`
}

function noSourceDescription() {
  return '源数据暂无说明，可能是开发/内部命令，请谨慎使用。'
}

function categorize(name, flags, description) {
  const lower = `${name} ${flags.join(' ')} ${description}`.toLowerCase()
  if (FEATURED_COMMANDS.has(name.toLowerCase())) return '常用/精选'
  if (name.startsWith('-')) return '启动项'
  if (lower.includes('bot') || name.startsWith('bot_')) return 'Bot 与训练'
  if (name.startsWith('mp_') || lower.includes('round') || lower.includes('match')) return '对局规则'
  if (name.startsWith('sv_') || lower.includes('server')) return '服务器'
  if (name.startsWith('cl_crosshair') || name.startsWith('hud_') || name.startsWith('cl_hud') || lower.includes('crosshair')) {
    return '画面/HUD/准星'
  }
  if (name.startsWith('snd_') || name.startsWith('voice_') || lower.includes('sound') || lower.includes('volume')) return '声音'
  if (name.startsWith('+') || name === 'bind' || name === 'unbind' || lower.includes('input')) return '输入/绑定'
  if (name.startsWith('net_') || name.startsWith('cq_') || name.startsWith('fps_') || lower.includes('performance')) return '网络/性能'
  if (name.startsWith('demo') || name === 'record' || name === 'playdemo' || lower.includes('gotv')) return 'Demo/GOTV'
  if (name === 'map' || name === 'changelevel' || name.startsWith('workshop_') || lower.includes('map')) return '地图/工坊'
  if (isDevLike(name, flags, description)) return '开发/调试'
  return '未分类'
}

function riskLevel(name, flags, description) {
  const lower = `${name} ${flags.join(' ')} ${description}`.toLowerCase()
  if (name.startsWith('-')) return '启动项'
  if (lower.includes('cheat') || lower.includes('sv_cheats')) return '谨慎'
  if (isDevLike(name, flags, description)) return '开发/隐藏'
  return '普通'
}

function isDevLike(name, flags, description) {
  const lower = `${name} ${flags.join(' ')} ${description}`.toLowerCase()
  return lower.includes('developmentonly')
    || lower.includes('hidden')
    || lower.includes('debug')
    || lower.includes('devonly')
    || name.startsWith('debug_')
    || name.startsWith('dev_')
    || name.startsWith('vprof_')
    || name.startsWith('ent_')
}

function countBy(items, key) {
  return items.reduce((result, item) => {
    result[item[key]] = (result[item[key]] ?? 0) + 1
    return result
  }, {})
}

await main()
