<p align="center">
  <img src="public/logo.svg" width="96" alt="Eliauk 音乐" />
</p>

<h1 align="center">Eliauk 音乐</h1>

<p align="center">基于 Tauri 2 + Rust + Vue 3 的桌面音乐播放器，支持 Windows 与 macOS</p>

> 本项目是 [music-electron-react](../music-electron-react) 的重构版本，功能按 [迁移方案](./docs/功能方案/00-索引与里程碑.md) 实施，M1–M5 已完成。

## 功能

- 播放：播放队列、三种播放模式、试听片段、地址过期自动刷新、冷启动恢复队列与进度
- 发现音乐、排行榜、歌手、搜索；歌单详情与「播放全部」
- 二维码登录；用户歌单的新建、重命名、删除与增删歌曲；喜欢歌曲
- 全屏歌词（逐字高亮、翻译、偏移调节）与频谱图
- mini 播放器窗口、托盘播放控制、应用内与全局快捷键、系统媒体中心（Windows SMTC / macOS 正在播放）
- 原生右键菜单、深浅色主题、关闭时最小化到托盘或退出

## 技术栈

Tauri 2 · Rust · Vue 3 · TypeScript · Vite · Pinia · vue-router · naive-ui · Tailwind CSS v4 · Iconify（Remix Icon）· [@neteasecloudmusicapienhanced/api](https://github.com/NeteaseCloudMusicApiEnhanced/api-enhanced)

## 快速开始

```bash
pnpm install
pnpm dev        # 首次运行会先打包 NCM API sidecar，并编译 Rust 依赖，耗时较长
```

首次打包 sidecar 需要从 GitHub 下载 Node 基础二进制。网络受限时请先设置代理：

```bash
HTTPS_PROXY=http://127.0.0.1:7897 pnpm sidecar:build
```

## API 服务形态

| 形态         | 开发                    | 打包                      | 说明                                                          |
| ------------ | ----------------------- | ------------------------- | ------------------------------------------------------------- |
| 内嵌（默认） | `pnpm dev`              | `pnpm build`              | 随应用启动本地 API 服务，开箱即用                             |
| 远程         | `pnpm tauri:dev:remote` | `pnpm tauri:build:remote` | 连接自行部署的服务（`VITE_API_BASE_URL`），安装包不带 sidecar |

详见 [API服务接入.md](./docs/API服务接入.md)。

## 文档

| 文档                                           | 内容                                         |
| ---------------------------------------------- | -------------------------------------------- |
| [架构设计](./docs/架构设计.md)                 | 技术栈、进程模型、目录结构、分层约定         |
| [API服务接入](./docs/API服务接入.md)           | 内嵌/远程双形态、sidecar 打包与生命周期      |
| [平台兼容](./docs/平台兼容.md)                 | Windows / macOS 差异与发版验证清单           |
| [开发规范](./docs/开发规范.md)                 | 命名、代码风格、Git 提交、版本管理、常用命令 |
| [图标设计](./docs/图标设计.md)                 | 应用与托盘图标的设计与生成                   |
| [功能方案](./docs/功能方案/00-索引与里程碑.md) | 旧项目各功能的迁移方案与里程碑               |
| [更新日志](./CHANGELOG.md)                     | 各版本改动记录                               |

## 许可

MIT。音乐数据来自第三方开源 API，仅供学习交流使用。
