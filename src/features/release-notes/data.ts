export interface ReleaseNoteLink {
  label: string
  url: string
}

export interface ReleaseNoteItem {
  text: string
  links?: ReleaseNoteLink[]
}

export interface ReleaseNoteEntry {
  version: string
  date: string
  title: string
  summary: string
  source?: {
    label: string
    url: string
  }
  items: ReleaseNoteItem[]
}

export const releaseNoteEntries: ReleaseNoteEntry[] = [
  {
    version: '1.3.0',
    date: '2026-07-22',
    title: '1.3.0 多语言、启动参数、插件版本诊断',
    summary: '引入中英文双语界面，支持自定义 CS2 启动参数，显示插件版本号，应用内更新提示，上游资源包同步提醒。',
    items: [
      { text: '多语言支持：集成 vue-i18n，中英文界面切换（设置页）。' },
      { text: '自定义启动参数：启动弹窗增加额外参数输入框，自动保存。' },
      { text: '插件版本诊断：诊断面板显示 CounterStrikeSharp 及各插件版本号（读取 deps.json）。' },
      { text: '应用内更新提示：启动时检查 GitHub Release，有新版本弹窗引导下载。' },
      { text: '上游资源包同步：检测 ed0ard/CS2-Bot-Improver 新版本，侧栏显示更新提示。' },
      { text: 'Git 清理：NSIS 安装包加入 .gitignore，不再追踪 62MB 二进制文件。' },
    ],
  },
  {
    version: '1.2.1',
    date: '2026-07-21',
    title: '1.2.1 模式切换修复、比赛记录',
    summary: '修复 Bot/Online 模式切换后状态不刷新问题。新增比赛记录功能，管理 Demo 录像和战绩。',
    items: [
      { text: '修复模式切换后面板状态不更新：switchMode 和 applyDifficulty 操作后自动刷新环境状态。' },
      { text: '新增比赛记录模块：列出最近比赛 Demo，显示地图、时间、路径，支持打开目录和复制路径。' },
      { text: '修复"准备环境"死链接：QuickControl 中"目录与安装"按钮指向使用帮助页。' },
    ],
  },
  {
    version: '1.2.0',
    date: '2026-07-21',
    title: '1.2.0 自定义主题、面板整合',
    summary: '删除11套战队配色，改为深色/亮色双模式+HSL色相滑块自定义。准备环境合并入使用帮助。',
    items: [
      { text: '主题系统重做：深色/亮色双模切换，HSL滑块0-360度自由配色，即时预览保存。' },
      { text: '面板整合：准备环境（InstallView）合并入使用帮助（GuideView），导航4组→3组。' },
      { text: '库存模拟器：inventory.cstrike.app WebView内嵌，单击打开外部窗口。' },
      { text: '环境诊断升级：18项检查（含InventorySimulator和游戏模式），复制诊断含完整状态。' },
      { text: '指令库精简：删除24条lbtv_*无效命令、聊天/嘲讽和地图轮换标签页、固定/最近面板。' },
      { text: '配置控制台精简：删除AI聊天和Bot嘲讽UI（LBTV插件不存在）。' },
      { text: '移除Panel v1.4.2.exe：根除与助手的gameinfo.gi双重管理冲突。' },
      { text: '移除官网嵌入、赞赏码、交流群入口。' },
    ],
  },
  {
    version: '1.1.0',
    date: '2026-07-21',
    title: '1.1.0 代码重构：主题引擎独立化、指令库精简、ConfigView 瘦身',
    summary: '主题系统独立为数据文件，新增绿龙/G2配色。ConfigView瘦身40%。指令库清除所有LBTV无效命令。上游资源同步更新。',
    items: [
      { text: '代码重构：主题系统独立为 src/features/theme/themes.ts，新增战���配色只需修改一个文件。' },
      { text: '主题精简为7套：深色、亮色、猎鹰、天禄、小蜜蜂、G2、绿龙。' },
      { text: '配置控制台精简：删除AI聊天和Bot嘲讽（插件不存在），仅保留难度/模式/道具/Demo。' },
      { text: '指令库清理：删除所有 lbtv_* 无效命令（24条），删除聊天/嘲讽和地图轮换标签页。' },
      { text: '作战总览清理：删除刀具模板面板，默认固定命令清理。' },
      { text: '上游资源同步：内置 Commands.txt 从 ed0ard/CS2-Bot-Improver v1.4.2 拉取。' },
      { text: '新增库存模拟器：内嵌 inventory.cstrike.app，集成 InventorySimulator CSS 插件。' },
      { text: '移除 Panel v1.4.2.exe 冲突：资源包不再包含上游启动器，避免 gameinfo.gi 双重管理。' },
      { text: '安装卸载优化：自动清理旧版 Panel.exe 残留，修复联机/人机模式混乱问题。' },
      { text: 'Rust 后端死代码清理：移除 PlayerCosmetics/DropKnives/BotItems/PlusRuntime 相关函数。' },
    ],
  },
  {
    version: '1.0.0',
    date: '2026-07-21',
    title: '1.0.0 社区版：致敬原作者的二次开发',
    summary: '本版本基于 YuGeYu/cs2-bot-improver-assistant 二次开发。感谢原作者 YuGeYu 的开创性工作，感谢上游项目 ed0ard/CS2-Bot-Improver 和 numakkiyu/CS2-Bot-Improver-Plus 的所有贡献者。没有他们的付出，就不会有这个社区版。',
    source: {
      label: '上游原项目',
      url: 'https://github.com/YuGeYu/cs2-bot-improver-assistant',
    },
    items: [
      { text: '致谢：本项目基于 YuGeYu 的 CS2人机增强助手 (AGPL-3.0) 二次开发，完整保留上游 CS2-Bot-Improver 和 CS2-Bot-Improver-Plus 的所有功能。' },
      { text: '致谢：内置插件资源来源于 ed0ard/CS2-Bot-Improver v1.4.2，感谢 ed0ard 和所有插件贡献者为 CS2 Bot 增强社区做出的卓越贡献。' },
      { text: '新增双启动通道：Steam 协议 (steam://rungameid/730) 和直接启动 (cs2.exe + -insecure) 可在启动弹窗中随时切换。' },
      { text: '新增库存模拟器页面：内嵌 inventory.cstrike.app，支持皮肤浏览、开箱、贴纸、改名等全部功能。感谢 ianlucas/cs2-inventory-simulator。' },
      { text: '新增 CSS 库存同步插件：打包 InventorySimulator v3.0.1 进资源包，安装后自动加载，玩家可使用 !ws 指令同步库存到游戏内。感谢 ianlucas/cs2-css-inventory-simulator。' },
      { text: '新增战队主题配色：猎鹰(绿)、天禄(红)、小蜜蜂(黄)，加上原有的深色和亮色，共5套外观主题。' },
      { text: '项目更名：CS2人机助手社区版，独立于上游原项目维护。' },
      { text: '移除官网嵌入和内嵌浏览器功能，精简界面专注核心功能。' },
      { text: '移除赞赏入口，社区版完全免费无任何付费入口。' },
      { text: '库存模拟器页面替代原有玩家外观页面，提供更完整的皮肤预览和管理体验。' },
      { text: '上游插件资源更新至 ed0ard/CS2-Bot-Improver v1.4.2。' },
    ],
  },
  {
    version: '0.4.5',
    date: '2026-07-15',
    title: '0.4.5 Plus 完整 GUI、资源安全与玩家饰品',
    summary: '以 CS2-Bot-Improver-Plus v1.4.2.1 整包为基底，完整迁移高频 GUI 操作到现有助手，并修复玩家饰品页在读取前发生的空白渲染。',
    items: [
      { text: '新增 CS2 全量指令库入口，可搜索控制台命令、CVar、启动项和开发命令。' },
      { text: '指令保留英文原文，能确认的功能说明优先用中文展示，并保留源数据说明便于后续继续完善。' },
      { text: '同步 Plus v1.4.2.1 整包基底，并保留选边、外观稳定性与现有 AI、BotTaunt、NadeSystem、Demo、指令库等能力。' },
      { text: '安装前彻底删除旧插件、第三方插件和插件配置；新资源安装后会应用 Bot 模式 gameinfo.gi，并保留 Online / Bot 模板切换校验。' },
      { text: 'Bot / Online 模式、难度、Aim、Nades、队伍、目录状态和启动体验继续在现有作战总览中统一呈现；不会伪造 Steam 持久启动项同步。' },
      { text: '玩家饰品页改为结构化状态机，修复读取前空对象导致标题以下整页空白的问题；读取中、失败、未安装、CS2 运行中和正常配置都有固定页面状态。' },
      { text: '新增结构化刀具、手套、枪械、音乐盒、名称标签、StatTrak、纪念品与拾取时应用编辑；保存保留未知 JSON 字段，支持 BOM 清理、原子写入、数值校验和运行中拒写。' },
      { text: '掉落刀具支持按键录入、刀具多选与完整目录预览；只写入助手专属标记块，不会替换玩家已有 bind。' },
      { text: 'BOT 皮肤、档案、探员和音乐盒开关与 Plus 一致，仅保存助手本地偏好，不会伪造为游戏或插件外观开关。' },
      { text: '导入完整刀具、武器、手套、皮肤和音乐盒数据目录，使用延迟加载与图片懒加载控制首次页面开销。' },
      { text: '应用内保留 CS2-Bot-Improver 与 CS2-Bot-Improver-Plus 的 AGPL-3.0-or-later 来源说明和上游链接。' },
      { text: '修复玩家饰品读取兼容性：现在可直接读取 Plus 原始 player_knife_presets.json，兼容旧配置字段；已有刀具、枪械、手套和音乐盒预设无需手动修改。' },
    ],
  },
  {
    version: '0.4.4',
    date: '2026-07-03',
    title: '0.4.4 设置页、自启动与初次安装优化',
    summary:
      '本次新增设置页面，把主题切换、储存说明、自启动和首次自动安装集中到一起，让程序更专注于 CS2 人机增强安装和控制。',
    items: [
      { text: '新增设置页面，集中管理外观主题和程序行为。' },
      { text: '外观主题切换移动到设置页，深色和亮色模式仍会记住上次选择。' },
      { text: '新增储存说明，用更直白的方式说明程序会把哪些设置保存在本机、浏览器缓存和 CS2 插件目录。' },
      { text: '新增开机自启动开关，默认关闭，需要用户主动开启。' },
      { text: '新增新版本插件包初次安装选项，默认开启；识别到安全可安装的 CS2 目录后，会帮助新用户减少手动安装步骤。' },
      { text: '移除 Major 预测入口和页面，导航栏更聚焦于准备环境、作战控制、配置和帮助。' },
      { text: '更新内置插件包为 2026-07-03 新整包。' },
      { text: '修复设定打身体时 BOT 爆头率仍然偏高的问题，命中表现会更符合设置。' },
      { text: '优化道具系统的声音信息处理，减少脚步与声音轨迹记录开销，提升多人场景下的人机性能稳定性。' },
      { text: '修复 NadeSystem 同一 tick 多名 BOT 重复排队投掷相近快烟的问题，VIP 快烟等场景的投掷判断更稳定。' },
    ],
  },
  {
    version: '0.4.3',
    date: '2026-06-28',
    title: '0.4.3 旧版 BotHider 残留清理增强',
    summary:
      '本次更新增强卸载清理，会移除旧版 BotHider 0.1.9 残留，避免覆盖安装后 BOT 头像异常显示为问号。',
    items: [
      { text: '卸载插件包时会额外清理旧版 BotHider 0.1.9 残留的 BotHider.vdf、0Harmony 和 BotHiderApi。' },
      { text: '卸载结果会区分已删除目录数、已删除文件数和未找到项数，方便确认清理范围。' },
      { text: '当前版本已改为整包清理：删除 addons、plugins、cfg/plugins 与 MetaMod 加载文件；不会删除或恢复 gameinfo.gi 与 pak01_*.vpk。' },
    ],
  },
  {
    version: '0.4.2',
    date: '2026-06-18',
    title: '0.4.2 BotHider 与 NadeSystem 更新',
    summary:
      '本次更新同步新版 BotHiderImpl，并收紧 BOT 每回合投掷物数量，提升新版游戏环境兼容性，同时减少单个 BOT 在同一回合过量丢雷的情况。',
    items: [
      { text: '同步 BotHider 到上游新版 BotHiderImpl 0.2.5，更新 BOT 隐藏相关签名和 offset，提升新版游戏环境兼容性。' },
      { text: '调整 BOT 托管逻辑，回合开始后自动复活托管 BOT，移除旧的比赛结束 kick/refill 流程。' },
      { text: 'NadeSystem 增加每个 BOT 每回合投掷物硬限制：火/燃烧弹、HE、烟每回合最多 1 个，闪光每回合最多 2 个。' },
      { text: '限制覆盖普通投掷、反击雷、下包、拆包、灭火等特殊投掷路径，避免同一 BOT 单回合过量投掷。' },
      { text: '修正特殊烟/闪额度不足时仍被错误标记为已使用的问题。' },
    ],
  },
  {
    version: '0.4.1',
    date: '2026-06-15',
    title: '0.4.1 地图轮换恢复与 AI 聊天设置优化',
    summary:
      '本次更新补回 0.4.0 缺失的自动换图能力，并让 AI 聊天设置更容易启用。默认设置不变，升级后不会主动改动你的服务器和聊天配置。',
    items: [
      { text: '恢复地图轮换插件，之前 0.4.0 缺失的自动换图能力已经补回。' },
      { text: '地图轮换默认仍然关闭，不会影响你现在的服务器设置。' },
      { text: '想使用自动换图时，可以在指令中心复制 lbtv_map_rotation 1 开启；lbtv_map_next 可以立即切到下一张图，方便测试。' },
      { text: 'AI 聊天设置新增免费 Key 一键启用入口。默认不会写入 Key，只有你在编辑弹窗里点击启用并保存后才会生效。' },
      { text: '仍然可以手动填写自己的 API 地址和 API Key；免费 Key 只是快捷填充，不会覆盖已经填写的自定义 Key。' },
      { text: '当前安装策略会先清理现有插件包和插件配置，再写入内置整包。' },
      { text: '继续包含 Quick Control、诊断面板、常用命令、地图轮换平局边界修复等现有能力。' },
    ],
  },
  {
    version: '0.4.0',
    date: '2026-06-14',
    title: '0.4.0 整包与 Quick Control',
    summary:
      '本次更新对齐 LBTVCS2BotEnhancer 0.4.0 整包，新增 Quick Control，并继承 0.3.13 本地体验优化。不再附带或调用旧版外部启动工具，而是在当前 Tauri 助手内吸收高频玩家操作入口。',
    items: [
      { text: '内置资源包已替换为 LBTVCS2BotEnhancer 0.4.0 整包，安装后包含 BotHider、RayTrace、BotHiderImpl、RayTraceImpl 和 RoundDamageRecap。' },
      { text: '新增 Quick Control 页面，集中提供 Bot / Online 模式切换、难度切换、打开 CS2、Aim 预设、Nades 预设、刀具模板和 Teams 入口。' },
      { text: 'Aim、Nades、Knife 和 Teams 按 0.4.0 Commands.txt 做成一键复制入口，复制后粘贴到 CS2 控制台使用。' },
      { text: '指令中心新增 Teams 分类，接入 40 支职业队伍的 CT / T 阵营预设。' },
      { text: '安装检查、诊断和卸载清单已补充 0.4.0 新增目录与插件，避免继续按 0.3.x 资源结构判断。' },
      { text: '继续保留原有安装检查、BotTaunt / NadeSystem 编辑、Demo 查找、诊断日志和发布记录能力。' },
      { text: '保留最近目录、最近命令、最近 Demo 和本地提示状态，减少重复选择和复制。' },
      { text: '开始使用页新增快捷动作条，可以直接重新检查、打开 CS2、进入配置、复制 -insecure 或打开 Demo 目录。' },
      { text: '指令中心支持固定常用命令，bot_kick、bot_nades more、-insecure 和 lbtv_map_next 会默认出现在固定区。' },
      { text: '游戏配置页会显示最近保存或切换过的设置，方便回头继续调整。' },
      { text: '帮助中心新增诊断面板，可查看版本、目录、环境状态、运行状态、日志路径、最近错误和恢复点，并一键复制诊断信息。' },
      { text: '安装、模式切换和配置保存前会记录本地恢复点，帮助判断发生问题时影响了哪些范围。' },
      { text: '重新整理开始使用、游戏配置、指令中心和帮助中心的页面层级，重要按钮和状态更容易扫到。' },
      { text: '统一复制按钮、保存按钮、危险确认和弹窗底部操作区，操作后会有更明确的成功或失败反馈。' },
      { text: '优化空状态、阻塞状态和长路径显示，未选择目录、CS2 运行中、未安装等情况会给出更清楚的下一步。' },
      { text: '深色和浅色主题下的卡片、状态徽章、提示框和窄窗口布局做了统一打磨。' },
      { text: '继续包含 0.3.13 的地图轮换关键修复，已开启地图轮换的用户升级 0.4.0 时也会一并获得平局边界修正。' },
    ],
  },
  {
    version: '0.3.13',
    date: '2026-06-09',
    title: 'CS2人机增强助手 v0.3.13 地图轮换平局边界修复',
    summary: 'CS2人机增强助手 v0.3.13 地图轮换平局边界修复',
    items: [
      { text: '修复开启地图轮换后，12:12、15:15、18:18 等平局加时边界可能被误判为比赛结束的问题。' },
      { text: '平局边界现在只记录日志，不会发感谢消息，也不会自动换图。' },
      { text: '真正有人达到目标分，例如 16:14，才会触发比赛结束后的轮换。' },
      { text: '地图轮换仍默认关闭，需要手动输入 lbtv_map_rotation 1 开启。' },
    ],
  },
  {
    version: '0.3.12',
    date: '2026-06-09',
    title: '地图轮换插件更新',
    summary:
      '本次更新加入独立 MapRotation 地图轮换插件，默认关闭，不影响原有开服、手动换图和 Bot 行为。需要时可通过控制台开启比赛结束后的自动换图。',
    items: [
      { text: '新增 lbtv_map_rotation 1/0，可开启或关闭比赛结束后的自动地图轮换。' },
      { text: '新增 lbtv_map_next，可立即切到轮换列表中的下一张图，方便测试。' },
      { text: '地图轮换默认关闭，安装新版后不会改变现有服务器行为。' },
      { text: '比赛结束时会发送两行 LBTV 感谢消息，感谢上游项目 ed0ard/CS2-Bot-Improver 以及提供帮助、测试和反馈的朋友们。该消息不依赖地图轮换开关，地图轮换关闭时也会在比赛结束后发送。' },
      { text: '内置插件包已包含 MapRotation.dll，并继续保护已有插件配置。' },
    ],
  },
  {
    version: '0.3.11',
    date: '2026-06-06',
    title: '启动、提示和常用操作体验优化',
    summary:
      '本次更新重点优化启动等待、更新提醒、打开 CS2、常用指令复制和设置页面结构。安装新版后，常用操作会更集中，提示更轻，不影响继续使用软件。',
    items: [
      { text: '启动时会先展示新版应用图标，并在后台完成更新检查，减少刚打开软件时的突兀感。' },
      { text: '更新提示会按普通、推荐、强制三种强度展示；推荐更新可以稍后再说，不影响继续使用。' },
      { text: '“打开 CS2”调整为顶部唯一入口，点击后进入专门的启动游戏弹窗，通过 Steam 正确启动 CS2。' },
      { text: '安装、设置和帮助里的操作提示统一改为右上角全局浮层，不再挤占页面内容。' },
      { text: '常用指令页支持点击整条指令直接复制，右侧会显示复制状态，第一次进入也会提示使用方式。' },
      { text: '常用指令列表改为更紧凑的两列布局，窄屏和完整 Commands.txt 查看时会自动回到单列。' },
      { text: '安装检查、游戏设置、常用指令、帮助和更新日志页面改为摘要、折叠面板和弹窗结构，核心按钮保持常驻，细节按需展开。' },
      { text: 'AI API、BotTaunt 嘲讽文本、NadeSystem 恢复时间和 Demo 详情改为弹窗编辑或查看，页面更清爽。' },
      { text: '继续保留 Demo 查找和分享优化，并换用新版应用图标。' },
    ],
  },
  {
    version: '0.3.10',
    date: '2026-06-05',
    title: 'AI 对话与 Bot 嘲讽输出正式更新',
    summary:
      '这是 0.3.10 正式版本，主要增强 BotTaunt 的 AI 对话和嘲讽输出体验。不更新也不影响正常游玩，想体验更自然 AI 回复和原生 Bot 发言效果的用户可以安装。',
    items: [
      { text: 'AI 对话现在会参考最近聊天上下文，不再只看玩家当前一句话，回复更容易接上话题。' },
      { text: '支持第三方 OpenAI-compatible API，例如 DeepSeek；默认 LBTV AI API 仍然保留原逻辑。' },
      { text: 'AI 回复、开局嘲讽、击杀嘲讽、多杀、残局、保枪、BOT 内斗和 MVP 嘲讽会优先使用 Bot 原生 say / say_team 输出。' },
      { text: '如果原生发言失败，会自动回退到原来的插件打印方式，避免嘲讽内容完全丢失。' },
      { text: '新增 AI 聊天诊断命令，方便测试配置、发言和回复链路是否正常。' },
      { text: '这是正式版本，但不是强制更新；当前版本能正常游玩的用户可以按需升级。' },
    ],
  },
  {
    version: '0.3.9',
    date: '2026-06-04',
    title: 'AI 回复提示词测试版',
    summary:
      '这是一个不完全的 0.3.9 测试版本，不是必要更新。当前主要用于测试 BotTaunt 的 AI 回复风格，未来可能会继续把更多内容加入 0.3.9 测试版。',
    items: [
      { text: 'BotTaunt 的 AI 回复改为预设提示词驱动，减少多余前缀、解释和换行。' },
      { text: '增强梗式类比、懂你意思类热梗和张雪峰相关歌词接句的回复表现。' },
      { text: '加入更窄的显示前清理，降低聊天区出现重复 BOT 名前缀的概率。' },
      { text: '这是测试版更新，当前稳定使用 0.3.8 的用户可以不急着安装。' },
    ],
  },
  {
    version: '0.3.8',
    date: '2026-06-02',
    title: '窗口体验与界面细节优化',
    summary:
      '本次更新优化程序窗口外观、导航反馈、安装检查页和 Demo 说明。游戏内设置不需要重新配置，安装新版后直接生效。',
    items: [
      { text: '程序窗口改为无边框样式，新增顶部标题栏用于拖动窗口。' },
      { text: '新增自定义最小化、最大化/还原和关闭按钮。' },
      { text: '新增独立顶部标题栏，修复无边框窗口无法拖动的问题。' },
      { text: '修复最小化、最大化/还原和关闭按钮点击无效的问题。' },
      { text: '优化左侧导航栏的选中、高亮和悬停效果，切换页面时视觉反馈更顺滑。' },
      { text: '精简安装检查页，移除使用频率很低的复制诊断信息和复制完整日志按钮。' },
      { text: '调整录制人机 Demo 的说明，提示 Demo 文件会生成在 game/csgo/replays 文件夹附近。' },
      { text: '这次不新增设置项，安装新版后直接生效。' },
    ],
  },
  {
    version: '0.3.7',
    date: '2026-06-01',
    title: '投掷物轨迹优化',
    summary:
      '本次更新优化 NadeSystem 的投掷物生成表现，让烟雾弹、高爆雷和燃烧瓶的轨迹更稳定，同时保留原有 Bot 投掷机制。',
    items: [
      { text: '优化烟雾弹、高爆雷和燃烧瓶的生成参数，投掷轨迹更稳定。' },
      { text: '保留 Bot 投掷后的短暂停火、道具预算、道具上限和伤害归因等现有机制。' },
      { text: '闪光弹、诱饵弹以及诱饵循环生成的闪光弹继续沿用原本表现。' },
      { text: '内置插件包已更新为 2026-06-01 的新版 fresh 整包。' },
    ],
  },
  {
    version: '0.3.6',
    date: '2026-05-30',
    title: '刀具生成与嘲讽文本编辑增强',
    summary:
      '本次更新优化了按键生成刀具的体验，并让更多 BotTaunt 台词可以直接在程序里修改，想换成自己的梗会更方便。',
    items: [
      { text: '默认按 \\ 现在生成热门五刀：爪子刀、蝴蝶刀、锯齿爪刀、M9 刺刀和刺刀。' },
      { text: '常用指令页面新增刀具模式命令，方便直接复制到控制台。' },
      { text: '输入 lbtv_knife_hot 可切回热门五刀模式，适合日常快速试刀。' },
      { text: '输入 lbtv_knife_rdm 可切到轮换五刀组合，每次生成一组不同刀型。' },
      { text: '输入 lbtv_knife_all 可切回旧版逻辑，一次生成全部刀具。' },
      { text: '新增 lbtv_bot_rivalry 1/0，可开启或关闭 BOT 击杀敌方 BOT 时的低频互相嘲讽。' },
      { text: 'BOT 互相嘲讽默认关闭，不影响玩家击杀嘲讽、玩家互动和 AI 聊天回复。' },
      { text: '游戏设置里的嘲讽文本编辑升级，现在可修改 BOT 互相嘲讽语句池。' },
      { text: '单回合 5 杀、5 秒 3 杀、残局和保枪台词也可以在程序里直接修改。' },
      { text: '配置读取兼容带 BOM 的 JSON 文件，减少手动编辑配置后出现解析失败的情况。' },
      { text: '内置插件包已更新，包含新版 BotTaunt、刀具生成模式和说明文档。' },
    ],
  },
  {
    version: '0.3.5',
    date: '2026-05-29',
    title: '嘲讽文本与投掷后恢复优化',
    summary:
      '本次更新让 BotTaunt 嘲讽文本可以在程序内修改，并优化 Bot 投掷道具后的开火恢复，减少刚丢完道具立刻开枪的情况。',
    items: [
      { text: '内置插件包已更新到最新版本，包含 BotTaunt、NadeSystem 和相关说明文档。' },
      { text: '游戏设置中新增 BotTaunt 嘲讽文本编辑，可分别修改普通击杀、爆头、刀杀和开局嘲讽。' },
      { text: '嘲讽文本现在保存在 Taunts.json，后续想换台词不需要重新编译插件。' },
      { text: '安装和升级时会继续保护已有插件配置，避免覆盖你已经改过的 BotTaunt 与 NadeSystem 设置。' },
      { text: '游戏设置中新增 NadeSystem 恢复时间编辑，可调整闪光、烟雾、高爆、燃烧瓶、燃烧弹和诱饵弹的恢复秒数。' },
      { text: '优化 Bot 使用插件道具后的开火恢复，减少刚投掷完道具就立刻开枪的突兀情况。' },
      { text: '增强恢复期压制逻辑，让 Bot 在恢复期内更稳定地停止瞄准与射击。' },
      { text: '新增 NadeSystem 诊断命令，便于排查恢复状态：lbtv_nade_recovery_debug、lbtv_nade_recovery_status、lbtv_nade_recovery_test。' },
      { text: 'BotTaunt AI 聊天规则同步优化：过长消息会被忽略，回复冷却固定为 10 秒，开局与 MVP 嘲讽触发更稳定。' },
    ],
  },
  {
    version: '0.3.4',
    date: '2026-05-27',
    title: 'Bot 投掷后恢复',
    summary:
      '为 Bot 使用道具后加入短暂开火恢复，减少刚丢完道具立刻开枪的情况，同时不影响移动和下包等非射击动作。',
    items: [
      { text: 'Bot 生成投掷物后会进入短暂开火恢复。' },
      { text: '闪光和诱饵弹默认恢复时间为 0.55 秒。' },
      { text: '烟雾弹默认恢复时间为 0.85 秒。' },
      { text: '高爆雷默认恢复时间为 0.65 秒。' },
      { text: '燃烧瓶和燃烧弹默认恢复时间为 0.80 秒。' },
      { text: '内置资源包更新为 CS2BotImprover_fresh_lbtv.zip。' },
    ],
  },
  {
    version: '0.3.3',
    date: '2026-05-24',
    title: '更新日志、Demo 辅助和安装保护',
    summary:
      '新增应用内更新日志、Demo 录制辅助、安装时保护用户插件配置，并加入受保护的插件包卸载操作。',
    items: [
      { text: '新增更新日志页面，并与首次打开弹窗共用同一份数据。' },
      { text: '新增 tv_enable 1; tv_autorecord 1 的 Demo 录制提示。' },
      { text: '新增打开 game/csgo/replays 的按钮。' },
      { text: '安装时会保护 addons/counterstrikesharp/configs/plugins/ 下已有文件。' },
      { text: '新增已知 CS2-Bot-Improver 插件目录的受保护卸载。' },
    ],
  },
  {
    version: '0.3.2',
    date: '2026-05-24',
    title: '上游 v1.3.0 说明',
    summary: '首次打开弹窗已对齐上游 v1.3.0 更新和应用侧辅助功能。',
    source: {
      label: 'GitHub v1.3.0',
      url: 'https://github.com/ed0ard/CS2-Bot-Improver/releases/tag/v1.3.0',
    },
    items: [
      { text: '同步上游的 Bot 道具点位、瞄准行为、经济逻辑、音乐盒和队伍数据。' },
      { text: '新增交流群入口、我的指令、Commands.txt 查看和 AI API 编辑等应用辅助功能。' },
    ],
  },
  {
    version: '0.3.1',
    date: '2026-05-24',
    title: 'Fresh 资源包更新',
    summary: '主内置包替换为 CS2BotImprover_fresh_lbtv.zip，并恢复 LBTV 人机增强功能。',
    items: [
      { text: '内置资源包替换为 CS2BotImprover_fresh_lbtv.zip。' },
      { text: '恢复 BotTaunt、AI 聊天回复、lbtv_bot_taunt、lbtv_bot_chat 和 lbtv_difficulty。' },
      { text: '恢复回合伤害统计，并优化道具来源识别。' },
    ],
  },
  {
    version: '0.3.0',
    date: '2026-05-24',
    title: '主线包正式发布',
    summary: '当前 fresh 资源线的正式打包版本。',
    items: [
      { text: '对齐应用版本并构建 NSIS 安装包。' },
      { text: '交付安装包保存在 release 目录中。' },
    ],
  },
  {
    version: '0.2.13',
    date: '2026-05-22',
    title: 'AI 聊天 API 设置',
    summary: '新增应用内读取和保存 BotTaunt AI API 设置的能力。',
    items: [
      { text: '新增 AI 聊天 API 设置卡片，可编辑 URL 和 API Key。' },
      { text: '新增 Tauri 命令，用于读取和补丁式写入 BotTaunt.json，并保留未知字段。' },
    ],
  },
  {
    version: '0.2.11',
    date: '2026-05-13',
    title: 'LBTV 资源包更新',
    summary: '替换上游 LBTV 资源包并完成正式打包。',
    items: [
      { text: '替换主内置资源包。' },
      { text: '发布前完成工作区配置和最终安装包输出验证。' },
    ],
  },
]

export const latestReleaseNote = releaseNoteEntries[0]!
