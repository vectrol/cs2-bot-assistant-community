type CommandItem = {
  command: string
  summary: string
  copyWithoutSemicolon?: boolean
}

export const weaponCommands = [
  { command: 'elite', label: '双枪' },
  { command: 'p250', label: 'P250' },
  { command: 'fn57', label: 'FN57' },
  { command: 'deagle', label: '沙鹰' },
  { command: 'cz75a', label: 'CZ75' },
  { command: 'r8', label: 'R8' },
  { command: 'bizon', label: '野牛' },
  { command: 'p90', label: 'P90' },
  { command: 'mp5sd', label: 'MP5-SD' },
  { command: 'mp9', label: 'MP9' },
  { command: 'mp7', label: 'MP7' },
  { command: 'mac10', label: '吹风机' },
  { command: 'ump45', label: 'UMP45' },
  { command: 'mag7', label: '警喷' },
  { command: 'sawedoff', label: '匪喷' },
  { command: 'nova', label: '新星' },
  { command: 'xm1014', label: '连喷' },
  { command: 'famas', label: '法玛斯' },
  { command: 'galilar', label: '加利尔' },
  { command: 'm4a1', label: 'M4A4' },
  { command: 'm4a1s', label: 'M4A1 消音版' },
  { command: 'ak47', label: 'AK47' },
  { command: 'aug', label: 'AUG' },
  { command: 'sg556', label: 'SG553' },
  { command: 'ssg08', label: '鸟狙' },
  { command: 'awp', label: '大狙' },
  { command: 'scar20', label: '警连狙' },
  { command: 'g3sg1', label: '匪连狙' },
  { command: 'negev', label: '内格夫' },
  { command: 'm249', label: 'M249' },
]

export const commandGroups = [
  {
    title: 'Bot 枪法',
    description: '控制 Bot 的瞄准倾向。',
    commands: [
      { command: 'bot_aim mixed', summary: '默认模式，Bot 会根据局势灵活选择瞄准位置。' },
      { command: 'bot_aim head', summary: '让 Bot 优先瞄准头部。' },
      { command: 'bot_aim body', summary: '让 Bot 优先瞄准身体。' },
      { command: 'bot_aim', summary: '查看当前 Bot 瞄准模式。' },
    ] satisfies CommandItem[],
  },
  {
    title: 'Bot 投掷物',
    description: '控制 Bot 使用道具的强度和频率。',
    commands: [
      { command: 'bot_nades off', summary: 'Bot 不会投掷任何道具。' },
      { command: 'bot_nades normal', summary: '默认模式，Bot 遵循接近真人玩家的道具数量限制。' },
      { command: 'bot_nades more', summary: '推荐模式，沿用 normal 的判断逻辑，但允许更多道具。' },
      { command: 'bot_nades max', summary: '限制最少，Bot 会更频繁地使用道具。' },
      { command: 'bot_nades', summary: '查看当前 Bot 投掷物模式。' },
    ] satisfies CommandItem[],
  },
  {
    title: '常用控制',
    description: '快速调整 Bot 数量和当前对局。',
    commands: [
      { command: 'bot_kick', summary: '踢出当前全部 Bot。' },
      { command: 'bot_kick t', summary: '踢出一名 T 阵营 Bot。' },
      { command: 'bot_kick ct', summary: '踢出一名 CT 阵营 Bot。' },
      { command: 'bot_add_t', summary: '添加一名 T 阵营 Bot。' },
      { command: 'bot_add_ct', summary: '添加一名 CT 阵营 Bot。' },
      { command: 'bot_randombuy 1', summary: '让 Bot 随机买枪，改成 0 可关闭。' },
      { command: 'bot_quota 数字', summary: '把场上 Bot 数量补到指定数量。' },
      { command: 'mp_restartgame 1', summary: '保留当前设置并重开对局。' },
    ] satisfies CommandItem[],
  },
  {
    title: '插件功能',
    description: '和资源包 README 一致的常用附加命令。',
    commands: [
      { command: 'bot_buy', summary: '恢复 Bot 默认买枪逻辑。' },
      { command: 'scouts_on', summary: '在对局开始后开启 Flying Scoutsman。' },
      { command: 'scouts_off', summary: '关闭 Flying Scoutsman。' },
      { command: 'lbtv_bot_taunt 1', summary: '开启 Bot 击杀嘲讽。' },
      { command: 'lbtv_bot_taunt 0', summary: '关闭 Bot 击杀嘲讽。' },
      { command: 'lbtv_bot_chat 1', summary: '开启 Bot AI 聊天回复。' },
      { command: 'lbtv_bot_chat 0', summary: '关闭 Bot AI 聊天回复。' },
      { command: 'lbtv_bot_rivalry 1', summary: '开启 BOT 之间的低频互相嘲讽。' },
      { command: 'lbtv_bot_rivalry 0', summary: '关闭 BOT 之间的低频互相嘲讽。' },
      { command: 'lbtv_difficulty', summary: '查看当前 Bot 难度档位。' },
      { command: 'lbtv_knife_hot', summary: '切换为热门五刀：爪子、蝴蝶、锯齿、M9 和刺刀。' },
      { command: 'lbtv_knife_rdm', summary: '切换为轮换五刀组合，每次生成一组不同刀型。' },
      { command: 'lbtv_knife_all', summary: '切换为旧版模式，一次生成全部刀具。' },
      { command: '-insecure', summary: '把它加入 Steam 启动项，才能加载本地插件。', copyWithoutSemicolon: true },
      {
        command: '-disable_workshop_command_filtering',
        summary: '游玩创意工坊地图时，把它加入 Steam 启动项。',
        copyWithoutSemicolon: true,
      },
    ] satisfies CommandItem[],
  },
]

export const guideSections = [
  {
    title: '添加职业队 Bot',
    body: '打开资源包里的 Commands.txt，按队伍名称复制对应命令到游戏控制台即可。',
  },
  {
    title: '生成刀具',
    body: '准星指向地面后，按键盘上的 \\ 键生成刀具。默认是热门五刀，也可以在控制台输入 lbtv_knife_hot、lbtv_knife_rdm 或 lbtv_knife_all 切换模式。',
  },
  {
    title: '和朋友一起打 Bot',
    body: '进入对局后输入 status，找到 steamid: 后面的内容，在前面加上 connect 和空格，再发给朋友粘贴到控制台。',
  },
  {
    title: '禁用特工皮肤和音乐盒',
    body: '进入 game/csgo/addons/counterstrikesharp/plugins，把 BotRandomizer 文件夹重命名为 BotRandomizer_disabled。',
  },
  {
    title: '正常冲浪',
    body: '在游戏控制台输入 sv_standable_normal 0.7。',
  },
]
