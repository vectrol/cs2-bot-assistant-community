# CS2 Bot Improver Assistant

中文名：CS2人机增强助手

这是一个面向 Counter-Strike 2 的桌面助手，用于安装、检查和配置 CS2 Bot 增强相关资源。它不是上游插件本体，而是一个基于 Vue 3、Tauri 2 和 Rust 的安装配置工具。

## 功能

- 选择并检查 CS2 游戏目录。
- 安装内置 Bot 增强资源包，并在写入前检查 CS2 是否正在运行。
- 0.4.1 内置包对齐 `E:\LBTVCS2BotEnhancer` / `ed0ard/CS2-Bot-Improver`，恢复 0.4.0 缺失的 MapRotation 地图轮换插件，不附带也不调用旧版外部启动工具。
- 通过 Quick Control 页面集中操作 Bot / Online 模式、难度、Aim、Nades、刀具模板、Teams 预设和打开 CS2。
- 切换 Bot 难度和在线 / Bot 模式。
- 在指令中心搜索、分类查看并复制常用 CS2 控制台指令，也可以复制 40 支职业队伍 CT / T 阵营预设或保存自己的常用命令。
- 编辑 BotTaunt AI API、嘲讽文本和 NadeSystem 恢复时间。
- 查找最近录制的 Demo，复制路径或打开所在文件夹。
- 记住最近目录、最近页面、最近命令、最近 Demo、主题和已关闭提示，方便回头继续。
- 固定常用命令，并在指令中心顶部快速复制。
- 在写入类操作前记录本地恢复点，并在帮助中心复制诊断信息。
- 通过 Steam 协议 `steam://rungameid/730` 打开 CS2。
- 从远端更新接口读取普通、推荐和强制更新提示。
- 使用统一的弹窗、复制反馈、空状态和阻塞提示，减少安装和配置时的不确定感。

## 截图

下面截图覆盖开始使用、游戏配置、指令中心、帮助中心、启动弹窗、更新提示和辅助工具等主要界面。

| | |
|---|---|
| ![CS2人机增强助手截图 1](docs/screenshots/screenshot-01.png) | ![CS2人机增强助手截图 2](docs/screenshots/screenshot-02.png) |
| ![CS2人机增强助手截图 3](docs/screenshots/screenshot-03.png) | ![CS2人机增强助手截图 4](docs/screenshots/screenshot-04.png) |
| ![CS2人机增强助手截图 5](docs/screenshots/screenshot-05.png) | ![CS2人机增强助手截图 6](docs/screenshots/screenshot-06.png) |
| ![CS2人机增强助手截图 7](docs/screenshots/screenshot-07.png) | ![CS2人机增强助手截图 8](docs/screenshots/screenshot-08.png) |
| ![CS2人机增强助手截图 9](docs/screenshots/screenshot-09.png) | ![CS2人机增强助手截图 10](docs/screenshots/screenshot-10.png) |
| ![CS2人机增强助手截图 11](docs/screenshots/screenshot-11.png) | ![CS2人机增强助手截图 12](docs/screenshots/screenshot-12.png) |
| ![CS2人机增强助手截图 13](docs/screenshots/screenshot-13.png) | |

## 下载安装

普通用户建议从 GitHub Releases 下载最新安装包。

源码仓库不建议直接提交 NSIS 安装包、旧安装包缓存、WebView2 固定运行时或插件资源备份。这些文件应该放在 Release assets 中。

## 开发环境

需要：

- Node.js `^20.19.0` 或 `>=22.12.0`
- npm
- Rust 和 Cargo
- Tauri 2 所需的 Windows 构建环境

安装依赖：

```sh
npm install
```

启动 Web 调试：

```sh
npm run dev:web
```

启动桌面调试：

```sh
npm run dev:desktop
```

## 本地环境变量

复制 `.env.example` 为 `.env` 后按需调整。

```sh
cp .env.example .env
```

Windows PowerShell：

```powershell
Copy-Item .env.example .env
```

真实 `.env`、`.env.development` 和 `.env.production` 不应提交到公开仓库。

## 资源包说明

桌面打包配置会引用：

```text
src-tauri/resources/CS2BotImprover.zip
```

为了保持源码仓库轻量，这个二进制资源包默认不提交。需要构建桌面安装包时，请从项目 Release assets 或可信来源取得资源包，并放到上述路径。

0.4.1 构建使用的资源包来自：

```text
E:\LBTVCS2BotEnhancer\dist\LBTVCS2BotEnhancer.zip
```

资源包 SHA256：

```text
1A082DEBFD7419FA3EAB305D74F399E6670D20C0E2B7B90AB28E84CCE1DF6DE9
```

0.4.1 相比 0.4.0 的唯一重点是恢复地图轮换资源，继续使用现有指令中心命令 `lbtv_map_rotation 1/0` 和 `lbtv_map_next`。地图轮换默认关闭，不改变用户现有服务器行为。

安装检查和卸载清单已纳入 0.4.1 资源对象：

- `addons/BotHider`
- `addons/RayTrace`
- `addons/counterstrikesharp/configs/core.json`
- `addons/counterstrikesharp/plugins/BotHiderImpl`
- `addons/counterstrikesharp/plugins/MapRotation`
- `addons/counterstrikesharp/plugins/RayTraceImpl`
- `addons/counterstrikesharp/plugins/RoundDamageRecap`

当前助手把高频功能整合进桌面端，不复刻外部工具 UI，也不把额外启动程序写入 CS2 目录。Aim、Nades、Knife 和 Teams 走 0.4.0 `Commands.txt` 命令复制；地图轮换沿用 `lbtv_map_rotation` / `lbtv_map_next`；模式、难度、安装、卸载、配置编辑和诊断继续走 Tauri 原生文件操作。

0.4.1 构建验收项：

- `src-tauri/resources/CS2BotImprover.zip` 的 SHA256 必须等于 `1A082DEBFD7419FA3EAB305D74F399E6670D20C0E2B7B90AB28E84CCE1DF6DE9`。
- ZIP 内必须存在 `addons/counterstrikesharp/plugins/MapRotation/MapRotation.dll`、`MapRotation.deps.json`、`MapRotation.pdb` 和 `Commands.txt`。
- ZIP 内继续保留 `BotHiderImpl`、`RayTraceImpl` 和 `RoundDamageRecap`。
- 构建后记录 NSIS 安装包路径、写入时间、大小和 SHA256。

同理，以下内容不应进入主分支：

- `src-tauri/resources/*.bak*`
- `src-tauri/resources/webview2-fixed/`
- `src-tauri/target/`
- `dist/`
- `dist-release/`
- `output/`
- `video-output/`
- `video-cs2-*/`
- `workspace/runtime/`

如果后续决定把资源包纳入版本管理，建议使用 Git LFS，并明确上游来源和授权边界。

## 常用命令

类型检查：

```sh
npm run typecheck
```

单元测试：

```sh
npm run test
```

工作区配置检查：

```sh
npm run workspace:check
```

Web 生产构建：

```sh
npm run build:web
```

完整验证链：

```sh
npm run verify
```

构建桌面可执行文件：

```sh
npm run build:desktop
```

构建 Windows 安装包：

```sh
npm run bundle:desktop
```

注意：`npm run bundle:desktop` 需要 `src-tauri/resources/CS2BotImprover.zip` 存在。

## 项目结构

```text
config/                         # 工作区项目注册
docs/                           # 项目文档
public/                         # 静态资源
scripts/                        # 校验和发布脚本
src/                            # Vue 前端源码
src/components/                 # 通用组件
src/features/                   # 业务数据和功能模块
src/services/tauri/             # 前端调用 Tauri 命令的入口
src/stores/                     # Pinia 状态
src/views/                      # 页面
src-tauri/                      # Tauri / Rust 桌面层
tests/                          # 测试
workspace/projects/             # 项目源码工作区
```

当前注册项目：

- `cs2-bot-improver`：CS2 Bot 增强安装、配置和命令助手。

## 发布级验收

发布或交付测试包前建议至少完成：

- 逐页检查 `/install`、`/config`、`/commands`、`/custom-commands`、`/guide`、`/release-notes` 和 `/major`。
- 确认未选择目录、CS2 正在运行、尚未安装三种状态都有明确提示。
- 确认复制、保存、恢复默认、卸载确认、查看 Commands.txt 等弹窗和反馈一致。
- 运行 `npm run verify`。
- 如果需要安装包，再运行 `npm run bundle:desktop`，并记录 NSIS 安装包路径、写入时间、大小和 SHA256。

## 使用注意

- 在写入 CS2 目录、安装资源包、切换模式或修改配置前，请先退出 CS2。
- Bot 模式通常需要在 Steam 启动项加入 `-insecure`。
- 需要恢复在线比赛环境时，请移除 `-insecure`，并在助手中切回在线模式。
- “打开 CS2”使用 Steam 协议启动，不直接运行 `cs2.exe`。
- 最近状态、固定命令、恢复点和已关闭提示只保存在本机 `localStorage`，不需要后端服务。
- 遇到失败时，优先到帮助中心复制诊断信息；需要查看原始日志时，使用诊断面板里的“打开日志位置”。

## 维护边界

这些路径属于用户配置或用户习惯，不能在清理、升级和重装时轻易删除：

- `game/csgo/addons/counterstrikesharp/configs/plugins/`
- `game/csgo/addons/counterstrikesharp/configs/plugins/BotTaunt/BotTaunt.json`
- `game/csgo/addons/counterstrikesharp/configs/plugins/BotTaunt/Taunts.json`
- `game/csgo/addons/counterstrikesharp/configs/plugins/NadeSystem/NadeSystem.json`
- 应用本地偏好：最近目录、最近页面、固定命令、恢复点、最近错误和已关闭提示。

这些操作必须先退出 CS2：

- 安装或重做安装。
- 切换在线模式 / Bot 模式。
- 切换 Bot 难度。
- 保存 AI API、嘲讽文本或投掷物恢复时间。
- 卸载插件包。

适合直接重试的情况：

- Steam 目录自动扫描没有结果，可以手动选择 CS2 根目录后重试。
- Demo 目录不存在，可以让应用创建默认 `game/csgo/replays` 后再打开。
- Commands.txt 或诊断信息临时读取失败，可以重新读取。

需要先修复目录或权限的情况：

- 选择的目录不是 `Counter-Strike Global Offensive` 根目录。
- `game/csgo` 不存在或不可写。
- 安装所需顶层目录被同名文件占用。
- 资源包 `CS2BotImprover.zip` 缺失或无法读取。
- JSON 配置被写坏，需要先恢复为合法 JSON 再保存。

## 更新发布

推荐流程：

1. 完成代码修改。
2. 运行 `npm run verify`。
3. 确认 `src-tauri/resources/CS2BotImprover.zip` 已准备好。
4. 运行 `npm run bundle:desktop`。
5. 在 GitHub 创建版本 Release，例如 `v0.3.11`。
6. 上传 NSIS 安装包和必要资源包到 Release assets。
7. 如需客户端自动提示更新，在远端更新服务写入对应版本记录。

正式包和测试包要分清楚：

- 正式包使用版本号对应的标准安装包名称，作为 Release asset 发布。
- 同版本测试包需要在文件名里加入 `test` 或时间戳，避免覆盖正式包。
- 同版本重打包前先备份旧安装包，完成后记录新安装包路径、写入时间、大小和 SHA256。
- 发布材料需要同步更新应用内更新日志、README 截图、版本号检查结果、安装包校验结果和运行路径说明。

## 授权

本仓库中的助手源码使用 MIT License，详见 [LICENSE](./LICENSE)。

若 Release 中包含或再分发第三方插件二进制资源，需要单独确认上游项目授权，并在 Release 说明中标注来源和边界。
