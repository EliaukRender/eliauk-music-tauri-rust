# 更新日志

格式参考 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。
日常改动先记在「未发布」下，发版时由 `pnpm version:bump <版本>` 归入新版本，流程见 [开发规范](./docs/开发规范.md#版本管理)。

## [未发布]

## [1.0.0] - 2026-09-28

基于 Tauri 2 + Rust + Vue 3 重构 [music-electron-react](../music-electron-react) 的首个版本，完成迁移方案 M1–M5。

### 新增

- 播放内核：播放队列、顺序/随机/单曲循环、试听片段、地址过期自动刷新、冷启动恢复队列与进度
- 发现音乐、排行榜、歌手列表与歌手页、搜索；歌单详情与「播放全部」
- 二维码登录；用户歌单的新建、重命名、删除与增删歌曲；喜欢歌曲
- 全屏歌词：逐字高亮、翻译、罗马音、偏移调节
- 频谱图
- mini 播放器窗口
- 托盘菜单显示当前歌曲并支持播放控制
- 应用内快捷键与全局快捷键
- 系统媒体中心：Windows SMTC、macOS 正在播放，支持媒体键
- 原生右键菜单、深浅色主题、关闭时最小化到托盘或退出、窗口状态记忆
- 解灰开关（默认关闭）：无版权歌曲从第三方音源匹配播放，此时不显示频谱
- NCM API 双形态：内嵌 sidecar（默认）与远程服务

### 安全

- 登录凭据存入系统凭据库（macOS 钥匙串 / Windows 凭据管理器），不再明文保存在 localStorage；旧版本数据启动时自动迁移

[未发布]: https://github.com/EliaukRender/eliauk-music-tauri-rust/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/EliaukRender/eliauk-music-tauri-rust/releases/tag/v1.0.0
