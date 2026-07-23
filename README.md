# CS2 人机助手社区版

**CS2 Bot Assistant Community Edition**

基于 [YuGeYu/cs2-bot-improver-assistant](https://github.com/YuGeYu/cs2-bot-improver-assistant) 二次开发的 CS2 桌面助手。集成 Bot 增强插件安装管理、库存模拟器、指令库、配置控制台等一站式工具。

## 技术栈

| 层 | 技术 |
|---|---|
| 前端框架 | Vue 3.5 (`<script setup lang="ts">`) |
| 状态管理 | Pinia 3 |
| 路由 | vue-router 5 |
| 国际化 | vue-i18n 10（zh-CN / en-US） |
| 构建工具 | Vite 8 |
| 桌面框架 | Tauri 2 (Rust) |
| 类型检查 | vue-tsc 3 + TypeScript 6 |
| 测试 | Vitest 4 + jsdom + @vue/test-utils 2 |
| 代码检查 | oxlint + eslint（双系统并行） |
| CSS | 纯 CSS 变量（无 Tailwind/SCSS） |

## 功能

### 🎮 环境管理
- 自动扫描 CS2 安装目录（Steam 注册表 + 常见路径）
- 一键安装/卸载 Bot 增强插件包
- 18 项环境诊断检查
- 目录持久化记录

### ⚔️ 作战总览
- Bot / Online 模式切换（修改 `gameinfo.gi`）
- 三档难度预设（低/中/高）
- Steam 协议启动或直接启动 `cs2.exe` + `-insecure`
- 实时 CS2 进程监控 + 系统托盘

### 🎒 库存模拟器
- 集成 [inventory.cstrike.app](https://inventory.cstrike.app)
- 皮肤预览、开箱模拟、贴纸、改名
- 独立窗口打开

### 📋 指令库
- 分类搜索 CS2 控制台命令
- 一键复制到剪贴板
- 自定义指令管理
- 40 支职业战队预设配置

### ⚙️ 配置控制台
- AI API 配置（Bot 语音对话）
- Bot 嘲讽文本编辑
- 道具恢复时间调节（闪光/烟雾/高爆/燃烧弹/诱饵弹）
- Demo 录制设置

### 🎨 自定义主题
- 深色/亮色双模式
- HSL 色相滑块自定义主色调
- 实时预览，持久化存储

### 🚀 双启动通道
- `steam://rungameid/730` — 官方启动（带 VAC）
- 直接启动 cs2.exe + `-insecure` — 模组启动（带自定参数）

### 🔌 插件管理
- 内置插件启用/禁用开关
- 7 个 Bot 增强插件（见下）
- RoundDamageRecap 额外插件

## 内置插件

资源包基于 [ed0ard/CS2-Bot-Improver](https://github.com/ed0ard/CS2-Bot-Improver) v1.4.2，合并 [numakkiyu/CS2-Bot-Improver-Plus](https://github.com/numakkiyu/CS2-Bot-Improver-Plus) v1.4.2.4：

| 插件 | 功能 |
|---|---|
| BotAI | Bot 人格与策略 |
| BotAimImprover | 枪法增强（压枪、甩枪、穿烟） |
| BotBuy | 经济系统与武器购买 |
| NadeSystem | 投掷物智能 |
| BotRandomizer | Bot 皮肤/刀具/手套随机 |
| BotHider | Bot Steam 档案隐藏 |
| InventorySimulator | 库存同步（!ws 指令） |

额外插件：`plugins/RoundDamageRecap/` — 回合伤害回顾（CounterStrikeSharp，需单独构建）

## 开发环境

### 前置依赖

- **Node.js** `^20.19.0` 或 `>=22.12.0`
- **Rust** 和 Cargo（桌面构建需要）
- **Tauri 2 Windows 构建环境**（[官方文档](https://v2.tauri.app/start/prerequisites/)）

### 快速开始

```bash
# 安装依赖
npm install

# 启动 Vite 开发服务器（Web 预览，不需要 Rust）
npm run dev:web

# 启动 Tauri 桌面调试（需要 Rust）
npm run dev:desktop
```

### 命令参考

| 命令 | 用途 |
|---|---|
| `npm run dev:web` | Vite 开发服务器（`localhost:5173`） |
| `npm run dev:desktop` | Tauri 桌面应用调试 |
| `npm run typecheck` | vue-tsc 类型检查 |
| `npm run lint` | oxlint + eslint 双系统检查 |
| `npm run lint:fix` | 自动修复 lint 问题 |
| `npm run test` | Vitest 运行所有测试 |
| `npm run build:web` | 构建 Web 发行包 |
| `npm run build:desktop` | 构建桌面可执行文件（不含安装包） |
| `npm run bundle:desktop` | 构建 NSIS 安装包 |
| `npm run verify` | 完整验证链（见下） |

### 数据维护命令

| 命令 | 用途 |
|---|---|
| `npm run commands:fetch` | 从上游拉取 CS2 控制台变量 |
| `npm run commands:build` | 构建指令库数据 |
| `npm run workspace:check` | 验证项目注册表配置 |
| `npm run release:manifest` | 生成发布清单 |

### 完整验证链

`npm run verify` 按顺序执行：

```
workspace:check → typecheck → lint → test → build:web
```

建议开发迭代时先 `typecheck` 再 `test`，因为 vue-tsc 能捕获 Vitest 遗漏的类型错误。

## 项目结构

```
cs2-bot-improver-assistant/
├── src/                          # Vue 前端
│   ├── main.ts                   # 入口
│   ├── App.vue                   # 根组件
│   ├── app/
│   │   ├── create-app.ts         # 应用初始化（Pinia + i18n + Router）
│   │   └── i18n.ts               # 国际化配置
│   ├── router/
│   │   ├── index.ts              # 路由实例
│   │   └── routes.ts             # 11 条路由定义
│   ├── stores/                   # Pinia 状态管理
│   │   ├── cs2.ts                # CS2 环境与操作
│   │   ├── custom-commands.ts    # 自定义指令
│   │   ├── match-history.ts      # 对战历史
│   │   └── ui-preferences.ts     # UI 偏好
│   ├── services/
│   │   ├── tauri/                # Tauri 桥接层（唯一 invoke 入口）
│   │   │   ├── app.ts            # 运行时上下文、URL 打开
│   │   │   ├── cs2.ts            # CS2 操作（全部有 isTauriRuntime 守卫）
│   │   │   ├── autostart.ts      # 开机自启动
│   │   │   └── custom-commands.ts
│   │   └── software-updates.ts   # 更新检查
│   ├── features/                 # 业务领域分组
│   │   ├── cs2/                  # CS2 业务数据
│   │   ├── dashboard/            # 仪表盘
│   │   ├── release-notes/        # 发布日志
│   │   ├── settings/             # 设置
│   │   ├── software-updates/     # 软件更新状态机
│   │   └── theme/                # 主题引擎
│   ├── views/                    # 页面组件（11 个视图）
│   ├── components/               # 可复用 UI 组件
│   │   ├── layout/               # 布局组件（AppShell 等）
│   │   ├── ui/                   # 基础 UI 组件
│   │   └── config/               # 配置表单组件
│   ├── composables/              # Vue 组合式函数
│   ├── types/                    # TypeScript 类型定义
│   ├── locales/                  # i18n 翻译文件
│   │   ├── zh-CN.json
│   │   └── en-US.json
│   ├── config/                   # 运行时配置
│   └── styles/                   # 全局样式（纯 CSS 变量）
├── src-tauri/                    # Tauri / Rust 桌面层
│   ├── src/
│   │   ├── main.rs               # Windows 入口
│   │   ├── lib.rs                # Tauri Builder + 命令注册
│   │   ├── commands/             # Tauri 命令（~30 个）
│   │   │   ├── app.rs            # 运行时、自启动、URL
│   │   │   ├── cs2.rs            # CS2 操作命令
│   │   │   ├── custom_commands.rs
│   │   │   └── resource.rs       # 资源包管理
│   │   ├── services/             # Rust 业务逻辑
│   │   │   ├── app_runtime.rs    # 应用运行时
│   │   │   ├── cs2.rs            # CS2 文件操作
│   │   │   ├── custom_commands.rs
│   │   │   ├── monitor.rs        # CS2 进程监控 + 系统托盘
│   │   │   └── resource.rs       # ZIP 资源包操作
│   │   ├── models/               # Rust 数据结构
│   │   └── errors/               # 错误处理
│   ├── resources/                # 内置资源包
│   ├── capabilities/default.json # Tauri 权限声明
│   └── tauri.conf.json           # Tauri 配置（含变体）
├── tests/                        # 集成测试
├── scripts/                      # 构建与维护脚本
├── config/workspace/             # 项目注册表
│   └── projects.json
├── plugins/                      # 额外插件
│   └── RoundDamageRecap/         # 回合伤害回顾（C#）
└── workspace/                    # 多项目隔离目录
    ├── projects/
    └── runtime/
```

## 测试

```bash
# 运行所有测试
npm run test

# 运行特定测试文件
npx vitest tests/software-update-modal.spec.ts

# 监听模式
npx vitest
```

测试约定：
- 测试文件位于 `tests/` 和 `src/**/__tests__/`
- Tauri 服务调用通过 `vi.mock('@/services/tauri/*')` 模拟
- 测试设置：`vitest.setup.ts`（Pinia + vue-i18n + RouterLink/Transition 桩组件）
- 更新弹窗测试前调用 `resetSoftwareUpdateStateForTest()` 清理状态

## 构建与发布

### 桌面构建

```bash
# 仅构建可执行文件（不含安装包）
npm run build:desktop  # tauri build --no-bundle

# 完整 NSIS 安装包
npm run bundle:desktop # tauri build

# 一键全流程（资源包 + 类型检查 + 测试 + 安装包）
.\scripts\full-build.ps1 -CreateReleasePackage
```

### 版本升级

1. 更新 `package.json` 中的 `version`
2. 更新 `src-tauri/Cargo.toml` 中的 `[package] version`（**只改这一行**，不要全局替换版本号——有历史事故）
3. `npm run verify` 验证
4. `npm run build:desktop` 构建
5. 打 tag: `git tag v<新版本>`

> ⚠️ 版本号事故记录：2026-06-01 升级 0.3.7 时曾因跨文件批量替换误改 Cargo.lock 中第三方依赖版本。以后只精确修改项目自身版本字段，让 Cargo 维护锁文件。

### 资源包构建

```bash
.\scripts\build-resource-zip.ps1
```

从上游 GitHub Release 下载并合并 ed0ard 基础包 + numakkiyu Plus 插件，输出到 `src-tauri/resources/CS2BotImprover.zip`。

### Tauri 配置变体

| 文件 | 用途 |
|---|---|
| `tauri.conf.json` | 默认配置 |
| `tauri.prod.json` | 更新器工件配置 |
| `tauri.webview2-fixed.json` | WebView2 固定运行时版 |
| `tauri.webview2-offline.json` | WebView2 离线安装版 |

通过构建脚本合并不同配置变体。

### 国际化

- 默认语言：zh-CN
- 可用语言：en-US
- 翻译文件：`src/locales/{locale}.json`
- 用户偏好通过 `localStorage` 持久化（key: `cs2-locale`）

## 架构约定

- **`src/services/tauri/`** 是前端调用 Tauri API 的唯一入口，视图层禁止直接调用 Tauri
- 所有 Tauri 服务函数带 `isTauriRuntime()` 守卫，`dev:web` 模式下自动降级为 Web 模拟
- **多层架构**：`views/` 编排页面 → `features/` 领域逻辑 → `services/tauri/` 桥接 → Rust `commands/` → Rust `services/`
- 多项目隔离：`config/workspace/projects.json` 注册，`workspace/check` 验证
- 发行渠道差异通过 `.env.*` 或 `tauri.*.json` 配置，不硬编码

## 致谢

本项目基于以下开源项目，遵循 AGPL-3.0 协议：

- [YuGeYu/cs2-bot-improver-assistant](https://github.com/YuGeYu/cs2-bot-improver-assistant) — 原始助手框架
- [ed0ard/CS2-Bot-Improver](https://github.com/ed0ard/CS2-Bot-Improver) — Bot 增强插件集
- [numakkiyu/CS2-Bot-Improver-Plus](https://github.com/numakkiyu/CS2-Bot-Improver-Plus) — Bot 增强 Plus 插件
- [ianlucas/cs2-inventory-simulator](https://github.com/ianlucas/cs2-inventory-simulator) — 网页库存模拟器
- [ianlucas/cs2-css-inventory-simulator](https://github.com/ianlucas/cs2-css-inventory-simulator) — CSS 库存插件

## License

AGPL-3.0-or-later
