<p align="center">
  <img src="public/logo.svg" width="96" alt="Eliauk 音乐" />
</p>

<h1 align="center">Eliauk 音乐</h1>

<p align="center">基于 Tauri 2 + Rust + Vue 3 的桌面音乐播放器，支持 Windows 与 macOS</p>

> 本项目是 [music-electron-react](../music-electron-react) 的重构版本，目前处于骨架阶段，功能按 [迁移方案](./docs/功能方案/00-索引与里程碑.md) 逐步迁移。

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

| 文档                                           | 内容                                    |
| ---------------------------------------------- | --------------------------------------- |
| [架构设计](./docs/架构设计.md)                 | 技术栈、进程模型、目录结构、分层约定    |
| [API服务接入](./docs/API服务接入.md)           | 内嵌/远程双形态、sidecar 打包与生命周期 |
| [平台兼容](./docs/平台兼容.md)                 | Windows / macOS 差异与发版验证清单      |
| [开发规范](./docs/开发规范.md)                 | 命名、代码风格、Git 提交规范、常用命令  |
| [图标设计](./docs/图标设计.md)                 | 应用与托盘图标的设计与生成              |
| [功能方案](./docs/功能方案/00-索引与里程碑.md) | 旧项目各功能的迁移方案与里程碑          |

## 许可

MIT。音乐数据来自第三方开源 API，仅供学习交流使用。
