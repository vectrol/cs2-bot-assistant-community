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
