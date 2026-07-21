# CS2 人机助手社区版

**CS2 Bot Assistant Community Edition**

基于 [YuGeYu/cs2-bot-improver-assistant](https://github.com/YuGeYu/cs2-bot-improver-assistant) 二次开发的 CS2 桌面助手。感谢原作者 YuGeYu 的开创性工作。

内置插件来自 [ed0ard/CS2-Bot-Improver](https://github.com/ed0ard/CS2-Bot-Improver) v1.4.2，库存模拟器来自 [ianlucas/cs2-inventory-simulator](https://github.com/ianlucas/cs2-inventory-simulator) 和 [ianlucas/cs2-css-inventory-simulator](https://github.com/ianlucas/cs2-css-inventory-simulator)。

基于 Vue 3 + Tauri 2 + Rust 构建。

## 功能

- **环境管理**：扫描/选择 CS2 目录，一键安装/卸载 Bot 增强插件包
- **作战总览**：Bot/Online 模式切换、难度调节、直接启动或 Steam 启动 CS2
- **库存模拟器**：集成 inventory.cstrike.app，皮肤预览、开箱、贴纸、改名
- **指令库**：分类搜索并复制 CS2 控制台命令、40 支职业队伍预设
- **配置控制台**：道具恢复时间、Demo 录制设置
- **使用帮助**：安装检查、18 项环境诊断、FAQ、卸载
- **自定义主题**：深色/亮色双模式 + HSL 色相滑块自定义主色调
- **双启动通道**：Steam 协议 `steam://rungameid/730` 或直接启动 cs2.exe + `-insecure`

## 开发环境

- Node.js `^20.19.0` 或 `>=22.12.0`
- Rust 和 Cargo
- Tauri 2 所需的 Windows 构建环境

```bash
npm install
npm run dev:web       # Web 调试
npm run dev:desktop   # 桌面调试
npm run build:web     # Web 构建
npm run build:desktop # 桌面构建
npm run bundle:desktop# NSIS 安装包
npm run verify        # 完整验证链
```

## 项目结构

```
src/                    # Vue 前端
src-tauri/              # Tauri/Rust 桌面层
src/features/theme/     # 主题引擎
src/features/cs2/       # CS2 业务数据
scripts/                # 构建脚本
```

## 内置插件

资源包基于 ed0ard/CS2-Bot-Improver v1.4.2：

| 插件 | 功能 |
|------|------|
| BotAI | Bot 人格与策略 |
| BotAimImprover | 枪法增强（压枪、甩枪、穿烟） |
| BotBuy | 经济系统与武器购买 |
| NadeSystem | 投掷物智能 |
| BotRandomizer | Bot 皮肤/刀具/手套随机 |
| BotHider | Bot Steam 档案隐藏 |
| InventorySimulator | 库存同步（!ws 指令） |

## 上游致谢

本项目基于以下开源项目，遵循 AGPL-3.0 协议：

- [YuGeYu/cs2-bot-improver-assistant](https://github.com/YuGeYu/cs2-bot-improver-assistant) — 原始助手框架
- [ed0ard/CS2-Bot-Improver](https://github.com/ed0ard/CS2-Bot-Improver) — Bot 增强插件集
- [ianlucas/cs2-inventory-simulator](https://github.com/ianlucas/cs2-inventory-simulator) — 网页库存模拟器
- [ianlucas/cs2-css-inventory-simulator](https://github.com/ianlucas/cs2-css-inventory-simulator) — CSS 库存插件

## License

AGPL-3.0-or-later
