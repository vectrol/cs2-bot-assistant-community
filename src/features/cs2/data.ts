type CommandItem = {
  command: string
  summary: string
  copyWithoutSemicolon?: boolean
}

export type CommandTabKey = 'common' | 'bot' | 'nades' | 'teams' | 'weapons' | 'custom'

export type TeamPreset = {
  name: string
  ct: string
  t: string
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
    title: '启动选项',
    description: 'Steam 启动项和常用附加命令。',
    commands: [
      { command: 'bot_buy', summary: '恢复 Bot 默认买枪逻辑。' },
      { command: '-insecure', summary: '把它加入 Steam 启动项，才能加载本地插件。', copyWithoutSemicolon: true },
      {
        command: '-disable_workshop_command_filtering',
        summary: '游玩创意工坊地图时，把它加入 Steam 启动项。',
        copyWithoutSemicolon: true,
      },
    ] satisfies CommandItem[],
  },
]

export const commandCenterTabs: Array<{
  key: Exclude<CommandTabKey, 'custom'>
  label: string
  description: string
  commands: CommandItem[]
}> = [
  {
    key: 'common',
    label: '常用',
    description: '最常复制的启动项和对局控制。',
    commands: [
      { command: 'bot_kick', summary: '踢出当前全部 Bot。' },
      { command: 'mp_restartgame 1', summary: '保留当前设置并重开对局。' },
      { command: '-insecure', summary: '加入 Steam 启动项后才能加载本地插件。', copyWithoutSemicolon: true },
      {
        command: '-disable_workshop_command_filtering',
        summary: '游玩创意工坊地图时，把它加入 Steam 启动项。',
        copyWithoutSemicolon: true,
      },
    ],
  },
  {
    key: 'bot',
    label: 'Bot 控制',
    description: 'Bot 数量、枪法、买枪和重开对局。',
    commands: [
      ...(commandGroups.find((group) => group.title === '常用控制')?.commands ?? []),
      ...(commandGroups.find((group) => group.title === 'Bot 枪法')?.commands ?? []),
      { command: 'bot_buy', summary: '恢复 Bot 默认买枪逻辑。' },
    ],
  },
  {
    key: 'nades',
    label: '投掷物',
    description: '控制 Bot 使用道具的频率。',
    commands: commandGroups.find((group) => group.title === 'Bot 投掷物')?.commands ?? [],
  },
  {
    key: 'teams',
    label: '队伍',
    description: '40 支职业队伍，一键复制到 CT 或 T 阵营。',
    commands: [],
  },
  {
    key: 'weapons',
    label: '武器',
    description: '复制武器名称后，下一回合 Bot 会优先使用。',
    commands: weaponCommands.map((item) => ({
      command: item.command,
      summary: item.label,
    })),
  },
]

export const teamPresets: TeamPreset[] = [
  {
    name: 'Team Vitality',
    ct: 'bot_add_ct "apEX";bot_add_ct "ZywOo";bot_add_ct "ropz";bot_add_ct "mezii";bot_add_ct "flameZ";mp_teamlogo_1 vita;mp_teamname_1 Team Vitality',
    t: 'bot_add_t "apEX";bot_add_t "ZywOo";bot_add_t "ropz";bot_add_t "mezii";bot_add_t "flameZ";mp_teamlogo_2 vita;mp_teamname_2 Team Vitality',
  },
  {
    name: 'FURIA Esports',
    ct: 'bot_add_ct "yuurih";bot_add_ct "FalleN";bot_add_ct "KSCERATO";bot_add_ct "YEKINDAR";bot_add_ct "molodoy";mp_teamlogo_1 furi;mp_teamname_1 FURIA Esports',
    t: 'bot_add_t "yuurih";bot_add_t "FalleN";bot_add_t "KSCERATO";bot_add_t "YEKINDAR";bot_add_t "molodoy";mp_teamlogo_2 furi;mp_teamname_2 FURIA Esports',
  },
  {
    name: 'Falcons',
    ct: 'bot_add_ct "NiKo";bot_add_ct "TeSeS";bot_add_ct "m0NESY";bot_add_ct "karrigan";bot_add_ct "kyousuke";mp_teamlogo_1 fal;mp_teamname_1 Falcons',
    t: 'bot_add_t "NiKo";bot_add_t "TeSeS";bot_add_t "m0NESY";bot_add_t "karrigan";bot_add_t "kyousuke";mp_teamlogo_2 fal;mp_teamname_2 Falcons',
  },
  {
    name: 'MOUZ',
    ct: 'bot_add_ct "jL";bot_add_ct "torzsi";bot_add_ct "Spinx";bot_add_ct "xelex";bot_add_ct "xertioN";mp_teamlogo_1 mouz;mp_teamname_1 MOUZ',
    t: 'bot_add_t "jL";bot_add_t "torzsi";bot_add_t "Spinx";bot_add_t "xelex";bot_add_t "xertioN";mp_teamlogo_2 mouz;mp_teamname_2 MOUZ',
  },
  {
    name: 'FaZe Clan',
    ct: 'bot_add_ct "enkay J";bot_add_ct "frozen";bot_add_ct "Twistzz";bot_add_ct "broky";bot_add_ct "jcobbb";mp_teamlogo_1 faze;mp_teamname_1 FaZe Clan',
    t: 'bot_add_t "enkay J";bot_add_t "frozen";bot_add_t "Twistzz";bot_add_t "broky";bot_add_t "jcobbb";mp_teamlogo_2 faze;mp_teamname_2 FaZe Clan',
  },
  {
    name: 'The MongolZ',
    ct: 'bot_add_ct "bLitz";bot_add_ct "Techno4K";bot_add_ct "mzinho";bot_add_ct "910";bot_add_ct "cobrazera";mp_teamlogo_1 mngz;mp_teamname_1 The MongolZ',
    t: 'bot_add_t "bLitz";bot_add_t "Techno4K";bot_add_t "mzinho";bot_add_t "910";bot_add_t "cobrazera";mp_teamlogo_2 mngz;mp_teamname_2 The MongolZ',
  },
  {
    name: 'Natus Vincere',
    ct: 'bot_add_ct "Aleksib";bot_add_ct "iM";bot_add_ct "b1t";bot_add_ct "w0nderful";bot_add_ct "makazze";mp_teamlogo_1 navi;mp_teamname_1 Natus Vincere',
    t: 'bot_add_t "Aleksib";bot_add_t "iM";bot_add_t "b1t";bot_add_t "w0nderful";bot_add_t "makazze";mp_teamlogo_2 navi;mp_teamname_2 Natus Vincere',
  },
  {
    name: 'Spirit',
    ct: 'bot_add_ct "sh1ro";bot_add_ct "magixx";bot_add_ct "tN1R";bot_add_ct "zont1x";bot_add_ct "donk";mp_teamlogo_1 spir;mp_teamname_1 Spirit',
    t: 'bot_add_t "sh1ro";bot_add_t "magixx";bot_add_t "tN1R";bot_add_t "zont1x";bot_add_t "donk";mp_teamlogo_2 spir;mp_teamname_2 Spirit',
  },
  {
    name: 'G2 Esports',
    ct: 'bot_add_ct "huNter-";bot_add_ct "NertZ";bot_add_ct "SunPayus";bot_add_ct "HeavyGod";bot_add_ct "MATYS";mp_teamlogo_1 g2;mp_teamname_1 G2 Esports',
    t: 'bot_add_t "huNter-";bot_add_t "NertZ";bot_add_t "SunPayus";bot_add_t "HeavyGod";bot_add_t "MATYS";mp_teamlogo_2 g2;mp_teamname_2 G2 Esports',
  },
  {
    name: 'Aurora',
    ct: 'bot_add_ct "MAJ3R";bot_add_ct "XANTARES";bot_add_ct "woxic";bot_add_ct "soulfly";bot_add_ct "Wicadia";mp_teamlogo_1 aura;mp_teamname_1 Aurora',
    t: 'bot_add_t "MAJ3R";bot_add_t "XANTARES";bot_add_t "woxic";bot_add_t "soulfly";bot_add_t "Wicadia";mp_teamlogo_2 aura;mp_teamname_2 Aurora',
  },
  {
    name: 'B8',
    ct: 'bot_add_ct "s1zzi";bot_add_ct "alex666";bot_add_ct "npl";bot_add_ct "kensizor";bot_add_ct "esenthial";mp_teamlogo_1 b8;mp_teamname_1 B8',
    t: 'bot_add_t "s1zzi";bot_add_t "alex666";bot_add_t "npl";bot_add_t "kensizor";bot_add_t "esenthial";mp_teamlogo_2 b8;mp_teamname_2 B8',
  },
  {
    name: '3DMAX',
    ct: 'bot_add_ct "misutaaa";bot_add_ct "Maka";bot_add_ct "Lucky";bot_add_ct "Ex3rcice";bot_add_ct "Graviti";mp_teamlogo_1 3dm;mp_teamname_1 3DMAX',
    t: 'bot_add_t "misutaaa";bot_add_t "Maka";bot_add_t "Lucky";bot_add_t "Ex3rcice";bot_add_t "Graviti";mp_teamlogo_2 3dm;mp_teamname_2 3DMAX',
  },
  {
    name: 'paiN Gaming',
    ct: 'bot_add_ct "vsm";bot_add_ct "biguzera";bot_add_ct "piriajr";bot_add_ct "saffee";bot_add_ct "snow";mp_teamlogo_1 pain;mp_teamname_1 paiN Gaming',
    t: 'bot_add_t "vsm";bot_add_t "biguzera";bot_add_t "piriajr";bot_add_t "saffee";bot_add_t "snow";mp_teamlogo_2 pain;mp_teamname_2 paiN Gaming',
  },
  {
    name: 'Astralis',
    ct: 'bot_add_ct "HooXi";bot_add_ct "phzy";bot_add_ct "jabbi";bot_add_ct "Staehr";bot_add_ct "ryu";mp_teamlogo_1 astr;mp_teamname_1 Astralis',
    t: 'bot_add_t "HooXi";bot_add_t "phzy";bot_add_t "jabbi";bot_add_t "Staehr";bot_add_t "ryu";mp_teamlogo_2 astr;mp_teamname_2 Astralis',
  },
  {
    name: 'Team Liquid',
    ct: 'bot_add_ct "NAF";bot_add_ct "EliGE";bot_add_ct "malbsMd";bot_add_ct "siuhy";bot_add_ct "ultimate";mp_teamlogo_1 liq;mp_teamname_1 Team Liquid',
    t: 'bot_add_t "NAF";bot_add_t "EliGE";bot_add_t "malbsMd";bot_add_t "siuhy";bot_add_t "ultimate";mp_teamlogo_2 liq;mp_teamname_2 Team Liquid',
  },
  {
    name: 'Passion UA',
    ct: 'bot_add_ct "JT";bot_add_ct "try";bot_add_ct "sdy";bot_add_ct "Kvem";bot_add_ct "nicx";mp_teamlogo_1 psnu;mp_teamname_1 Passion UA',
    t: 'bot_add_t "JT";bot_add_t "try";bot_add_t "sdy";bot_add_t "Kvem";bot_add_t "nicx";mp_teamlogo_2 psnu;mp_teamname_2 Passion UA',
  },
  {
    name: 'Legacy',
    ct: 'bot_add_ct "dumau";bot_add_ct "latto";bot_add_ct "n1ssim";bot_add_ct "arT";bot_add_ct "saadzin";mp_teamlogo_1 lgcy;mp_teamname_1 Legacy',
    t: 'bot_add_t "dumau";bot_add_t "latto";bot_add_t "n1ssim";bot_add_t "arT";bot_add_t "saadzin";mp_teamlogo_2 lgcy;mp_teamname_2 Legacy',
  },
  {
    name: 'Imperial',
    ct: 'bot_add_ct "chelo";bot_add_ct "VINI";bot_add_ct "decenty";bot_add_ct "levi";bot_add_ct "noway";mp_teamlogo_1 imp;mp_teamname_1 Imperial',
    t: 'bot_add_t "chelo";bot_add_t "VINI";bot_add_t "decenty";bot_add_t "levi";bot_add_t "noway";mp_teamlogo_2 imp;mp_teamname_2 Imperial',
  },
  {
    name: 'PARIVISION',
    ct: 'bot_add_ct "Jame";bot_add_ct "BELCHONOKK";bot_add_ct "xiELO";bot_add_ct "nota";bot_add_ct "zweih";mp_teamlogo_1 pari;mp_teamname_1 PARIVISION',
    t: 'bot_add_t "Jame";bot_add_t "BELCHONOKK";bot_add_t "xiELO";bot_add_t "nota";bot_add_t "zweih";mp_teamlogo_2 pari;mp_teamname_2 PARIVISION',
  },
  {
    name: 'M80',
    ct: 'bot_add_ct "slaxz-";bot_add_ct "Swisher";bot_add_ct "s1n";bot_add_ct "JBa";bot_add_ct "Lake";mp_teamlogo_1 m80;mp_teamname_1 M80',
    t: 'bot_add_t "slaxz-";bot_add_t "Swisher";bot_add_t "s1n";bot_add_t "JBa";bot_add_t "Lake";mp_teamlogo_2 m80;mp_teamname_2 M80',
  },
  {
    name: 'GamerLegion',
    ct: 'bot_add_ct "Snax";bot_add_ct "REZ";bot_add_ct "Tauson";bot_add_ct "PR";bot_add_ct "hypex";mp_teamlogo_1 gl;mp_teamname_1 GamerLegion',
    t: 'bot_add_t "Snax";bot_add_t "REZ";bot_add_t "Tauson";bot_add_t "PR";bot_add_t "hypex";mp_teamlogo_2 gl;mp_teamname_2 GamerLegion',
  },
  {
    name: 'Virtus.pro',
    ct: 'bot_add_ct "FL1T";bot_add_ct "Perfecto";bot_add_ct "fame";bot_add_ct "b1st";bot_add_ct "tO0RO";mp_teamlogo_1 vp;mp_teamname_1 Virtus.pro',
    t: 'bot_add_t "FL1T";bot_add_t "Perfecto";bot_add_t "fame";bot_add_t "b1st";bot_add_t "tO0RO";mp_teamlogo_2 vp;mp_teamname_2 Virtus.pro',
  },
  {
    name: 'Ninjas in Pyjamas',
    ct: 'bot_add_ct "Snappi";bot_add_ct "sjuush";bot_add_ct "stavn";bot_add_ct "xKacpersky";bot_add_ct "cairne";mp_teamlogo_1 nip;mp_teamname_1 Ninjas in Pyjamas',
    t: 'bot_add_t "Snappi";bot_add_t "sjuush";bot_add_t "stavn";bot_add_t "xKacpersky";bot_add_t "cairne";mp_teamlogo_2 nip;mp_teamname_2 Ninjas in Pyjamas',
  },
  {
    name: 'HEROIC',
    ct: 'bot_add_ct "xfl0ud";bot_add_ct "nilo";bot_add_ct "susp";bot_add_ct "Chr1zN";bot_add_ct "yxngstxr";mp_teamlogo_1 hero;mp_teamname_1 HEROIC',
    t: 'bot_add_t "xfl0ud";bot_add_t "nilo";bot_add_t "susp";bot_add_t "Chr1zN";bot_add_t "yxngstxr";mp_teamlogo_2 hero;mp_teamname_2 HEROIC',
  },
  {
    name: 'Lynn Vision',
    ct: 'bot_add_ct "Westmelon";bot_add_ct "z4KR";bot_add_ct "Starry";bot_add_ct "EmiliaQAQ";bot_add_ct "C4LLM3SU3";mp_teamlogo_1 lynn;mp_teamname_1 Lynn Vision',
    t: 'bot_add_t "Westmelon";bot_add_t "z4KR";bot_add_t "Starry";bot_add_t "EmiliaQAQ";bot_add_t "C4LLM3SU3";mp_teamlogo_2 lynn;mp_teamname_2 Lynn Vision',
  },
  {
    name: 'NRG',
    ct: 'bot_add_ct "nitr0";bot_add_ct "Sonic";bot_add_ct "oSee";bot_add_ct "br0";bot_add_ct "Grim";mp_teamlogo_1 nrg;mp_teamname_1 NRG',
    t: 'bot_add_t "nitr0";bot_add_t "Sonic";bot_add_t "oSee";bot_add_t "br0";bot_add_t "Grim";mp_teamlogo_2 nrg;mp_teamname_2 NRG',
  },
  {
    name: 'BetBoom',
    ct: 'bot_add_ct "Boombl4";bot_add_ct "S1ren";bot_add_ct "d1Ledez";bot_add_ct "zorte";bot_add_ct "Magnojez";mp_teamlogo_1 bb;mp_teamname_1 BetBoom',
    t: 'bot_add_t "Boombl4";bot_add_t "S1ren";bot_add_t "d1Ledez";bot_add_t "zorte";bot_add_t "Magnojez";mp_teamlogo_2 bb;mp_teamname_2 BetBoom',
  },
  {
    name: 'FlyQuest',
    ct: 'bot_add_ct "jks";bot_add_ct "INS";bot_add_ct "Vexite";bot_add_ct "nettik";bot_add_ct "story";mp_teamlogo_1 fq;mp_teamname_1 FlyQuest',
    t: 'bot_add_t "jks";bot_add_t "INS";bot_add_t "Vexite";bot_add_t "nettik";bot_add_t "story";mp_teamlogo_2 fq;mp_teamname_2 FlyQuest',
  },
  {
    name: 'fnatic',
    ct: 'bot_add_ct "KRIMZ";bot_add_ct "Br4tkO";bot_add_ct "fEAR";bot_add_ct "jambo";bot_add_ct "jackasmo";mp_teamlogo_1 fntc;mp_teamname_1 fnatic',
    t: 'bot_add_t "KRIMZ";bot_add_t "Br4tkO";bot_add_t "fEAR";bot_add_t "jambo";bot_add_t "jackasmo";mp_teamlogo_2 fntc;mp_teamname_2 fnatic',
  },
  {
    name: 'TYLOO',
    ct: 'bot_add_ct "JamYoung";bot_add_ct "Jee";bot_add_ct "Mercury";bot_add_ct "Moseyuh";bot_add_ct "Zero";mp_teamlogo_1 tyl;mp_teamname_1 TYLOO',
    t: 'bot_add_t "JamYoung";bot_add_t "Jee";bot_add_t "Mercury";bot_add_t "Moseyuh";bot_add_t "Zero";mp_teamlogo_2 tyl;mp_teamname_2 TYLOO',
  },
  {
    name: 'Fluxo',
    ct: 'bot_add_ct "Lucaozy";bot_add_ct "zevy";bot_add_ct "decenty";bot_add_ct "kye";bot_add_ct "exit";mp_teamlogo_1 flux;mp_teamname_1 Fluxo',
    t: 'bot_add_t "Lucaozy";bot_add_t "zevy";bot_add_t "decenty";bot_add_t "kye";bot_add_t "exit";mp_teamlogo_2 flux;mp_teamname_2 Fluxo',
  },
  {
    name: '9INE',
    ct: 'bot_add_ct "raalz";bot_add_ct "kraghen";bot_add_ct "bnox";bot_add_ct "cej0t";bot_add_ct "flayy";mp_teamlogo_1 nein;mp_teamname_1 9INE',
    t: 'bot_add_t "raalz";bot_add_t "kraghen";bot_add_t "bnox";bot_add_t "cej0t";bot_add_t "flayy";mp_teamlogo_2 nein;mp_teamname_2 9INE',
  },
  {
    name: 'Monte',
    ct: 'bot_add_ct "Bymas";bot_add_ct "afro";bot_add_ct "Gizmy";bot_add_ct "AZUWU";bot_add_ct "Rainwaker";mp_teamlogo_1 mont;mp_teamname_1 Monte',
    t: 'bot_add_t "Bymas";bot_add_t "afro";bot_add_t "Gizmy";bot_add_t "AZUWU";bot_add_t "Rainwaker";mp_teamlogo_2 mont;mp_teamname_2 Monte',
  },
  {
    name: 'BESTIA',
    ct: 'bot_add_ct "nacho";bot_add_ct "cass1n";bot_add_ct "buda";bot_add_ct "tomaszin";bot_add_ct "timo";mp_teamlogo_1 bes;mp_teamname_1 BESTIA',
    t: 'bot_add_t "nacho";bot_add_t "cass1n";bot_add_t "buda";bot_add_t "tomaszin";bot_add_t "timo";mp_teamlogo_2 bes;mp_teamname_2 BESTIA',
  },
  {
    name: 'ENCE',
    ct: 'bot_add_ct "HENU";bot_add_ct "millert";bot_add_ct "teme";bot_add_ct "Cliqq";bot_add_ct "Schwarz";mp_teamlogo_1 ence;mp_teamname_1 ENCE',
    t: 'bot_add_t "HENU";bot_add_t "millert";bot_add_t "teme";bot_add_t "Cliqq";bot_add_t "Schwarz";mp_teamlogo_2 ence;mp_teamname_2 ENCE',
  },
  {
    name: 'ECSTATIC',
    ct: 'bot_add_ct "TMB";bot_add_ct "nicoodoz";bot_add_ct "Anelele";bot_add_ct "Buzz";bot_add_ct "nut nut";mp_teamlogo_1 ecst;mp_teamname_1 ECSTATIC',
    t: 'bot_add_t "TMB";bot_add_t "nicoodoz";bot_add_t "Anelele";bot_add_t "Buzz";bot_add_t "nut nut";mp_teamlogo_2 ecst;mp_teamname_2 ECSTATIC',
  },
  {
    name: 'Rare Atom',
    ct: 'bot_add_ct "Summer";bot_add_ct "3gl";bot_add_ct "Trash";bot_add_ct "L1haNg";bot_add_ct "chengking";mp_teamlogo_1 ratm;mp_teamname_1 Rare Atom',
    t: 'bot_add_t "Summer";bot_add_t "3gl";bot_add_t "Trash";bot_add_t "L1haNg";bot_add_t "chengking";mp_teamlogo_2 ratm;mp_teamname_2 Rare Atom',
  },
  {
    name: 'OG',
    ct: 'bot_add_ct "cadiaN";bot_add_ct "spooke";bot_add_ct "arrozdoce";bot_add_ct "adamb";bot_add_ct "bodyy";mp_teamlogo_1 og;mp_teamname_1 OG',
    t: 'bot_add_t "cadiaN";bot_add_t "spooke";bot_add_t "arrozdoce";bot_add_t "adamb";bot_add_t "bodyy";mp_teamlogo_2 og;mp_teamname_2 OG',
  },
  {
    name: '100 Thieves',
    ct: 'bot_add_ct "Ag1l";bot_add_ct "device";bot_add_ct "poiii";bot_add_ct "sirah";bot_add_ct "rain";mp_teamlogo_1 thv;mp_teamname_1 100 Thieves',
    t: 'bot_add_t "Ag1l";bot_add_t "device";bot_add_t "poiii";bot_add_t "sirah";bot_add_t "rain";mp_teamlogo_2 thv;mp_teamname_2 100 Thieves',
  },
  {
    name: 'BIG',
    ct: 'bot_add_ct "tabseN";bot_add_ct "JDC";bot_add_ct "faveN";bot_add_ct "blameF";bot_add_ct "gr1ks";mp_teamlogo_1 big;mp_teamname_1 BIG',
    t: 'bot_add_t "tabseN";bot_add_t "JDC";bot_add_t "faveN";bot_add_t "blameF";bot_add_t "gr1ks";mp_teamlogo_2 big;mp_teamname_2 BIG',
  },
  {
    name: 'BC.Game',
    ct: 'bot_add_ct "s1mple";bot_add_ct "electroNic";bot_add_ct "Senzu";bot_add_ct "Magisk";bot_add_ct "mzinho";mp_teamlogo_1 bcg;mp_teamname_1 BC.Game',
    t: 'bot_add_t "s1mple";bot_add_t "electroNic";bot_add_t "Senzu";bot_add_t "Magisk";bot_add_t "mzinho";mp_teamlogo_2 bcg;mp_teamname_2 BC.Game',
  },
  {
    name: '9z Team',
    ct: 'bot_add_ct "max";bot_add_ct "HUASOPEEK";bot_add_ct "luchov";bot_add_ct "meyern";bot_add_ct "dgt";mp_teamlogo_1 9z;mp_teamname_1 9z Team',
    t: 'bot_add_t "max";bot_add_t "HUASOPEEK";bot_add_t "luchov";bot_add_t "meyern";bot_add_t "dgt";mp_teamlogo_2 9z;mp_teamname_2 9z Team',
  },
]

export const guideSections = [
  {
    title: '怎么选对目录',
    body: '选择 CS2 的游戏根目录，一般是 SteamLibrary\\steamapps\\common\\Counter-Strike Global Offensive。选中后页面会检查 game、csgo、MetaMod 和 CounterStrikeSharp 是否齐全。',
  },
  {
    title: '怎么切 Bot / 在线模式',
    body: '在“游戏配置”页使用模式切换。Bot 模式用于本地插件练习，在线模式用于正常比赛。切换前请先退出 CS2，避免正在运行的游戏占用文件。',
  },
  {
    title: '怎么加 -insecure',
    body: '在 Steam 库里右键 CS2，打开属性，在启动选项里加入 -insecure。想回到在线比赛前，先切回在线模式，再删除这个启动项。',
  },
  {
    title: '怎么和朋友联机',
    body: '进入对局后在控制台输入 status，找到 steamid: 后面的地址，在前面加上 connect 和空格，再发给朋友粘贴到控制台。',
  },
  {
    title: '怎么找 Demo',
    body: '在“游戏配置”的辅助操作里复制 tv_enable 1; tv_autorecord 1，打一局后点击查找最近 Demo。页面会显示最近文件、目录和完整路径。',
  },
  {
    title: '怎么卸载',
    body: '在本页底部的危险操作区确认卸载。卸载会彻底删除 addons、plugins、cfg/plugins 和 MetaMod 加载文件，包含所有第三方插件配置；不会删除 CS2 本体。',
  },
  {
    title: '安装会清理什么',
    body: '每次安装都会先彻底删除现有插件包和所有插件配置，再安装内置整包。cfg/autoexec.cfg、游戏模式配置、overrides、gameinfo.gi 和 CS2 本体不会被删除。',
  },
]
