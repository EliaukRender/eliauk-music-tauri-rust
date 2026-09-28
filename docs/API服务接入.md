# API 服务接入

音乐数据来自 [@neteasecloudmusicapienhanced/api](https://github.com/NeteaseCloudMusicApiEnhanced/api-enhanced)。原版 NeteaseCloudMusicApi 已停止维护，这是社区续作，仍在持续更新。

支持两种形态，在**构建期**确定：

| 形态         | 命令                                                | 产物是否带 sidecar     | 前端 baseURL 来源                             |
| ------------ | --------------------------------------------------- | ---------------------- | --------------------------------------------- |
| 内嵌（默认） | `pnpm dev` / `pnpm build`                           | 是（约 75MB 原始体积） | Rust 端分配端口后通过 `get_api_endpoint` 下发 |
| 远程         | `pnpm tauri:dev:remote` / `pnpm tauri:build:remote` | 否                     | `VITE_API_BASE_URL`                           |
| 浏览器调试   | `pnpm dev:web`（可配合 `pnpm sidecar:serve`）       | -                      | `VITE_API_BASE_URL`                           |

## 切换机制

两个开关同时生效，缺一不可：

1. **cargo feature `embedded-api`**：控制 `tauri-plugin-shell` 依赖以及 `src-tauri/src/api_server/embedded.rs` 是否参与编译。远程形态不启用，Rust 产物中不包含进程管理代码。
2. **`tauri.embedded.conf.json`**：声明 `bundle.externalBin` 并在 before 命令中构建 sidecar。远程形态不合并此文件，安装包中不包含 sidecar 二进制。

所以切到远程形态后，安装包体积会恢复到纯 Tauri 应用的水平。

前端**不需要**知道当前是哪种形态：`src/services/tauri/api-endpoint.ts` 先询问 Rust 端，Rust 返回 `embedded` 就使用下发的地址，返回 `remote` 就读取环境变量。形态的唯一事实来源是 cargo feature。

## 远程形态配置

1. 自行部署 API 服务（参考上游文档，Docker / Node 均可），确认服务可以从客户端网络访问。
2. 在 `.env.production.local` 中写入 `VITE_API_BASE_URL=https://your-api.example.com`（该文件不入库）。
3. 执行 `pnpm tauri:build:remote`。

远程服务需要允许以下来源的跨域请求（上游默认回显请求 Origin，无需额外配置；如果设置了 `CORS_ALLOW_ORIGIN`，要把它们加进去）：

- macOS：`tauri://localhost`
- Windows：`http://tauri.localhost`

## 内嵌形态实现

### sidecar 打包（`sidecar/ncm-api`）

- 上游在运行时通过 `fs.readdir(module/)` 动态 `require` 全部接口模块，并从 `__dirname` 读取 `data/*.txt`。常规 bundler 处理不了这种写法，所以选用 [@yao-pkg/pkg](https://github.com/yao-pkg/pkg)。它的 snapshot 文件系统能透明支持这类读取，上游官方的 precompiled 产物也是用 pkg 打的。
- `scripts/build.mjs` 根据目标三元组选择 pkg target，并输出 `src-tauri/binaries/ncm-api-<triple>[.exe]`，这是 Tauri externalBin 要求的命名。
  - 三元组的来源优先级：`--target` > `TAURI_ENV_TARGET_TRIPLE`（`tauri build --target` 时由 before 命令注入）> `rustc` 宿主。
  - 以「入口 + 构建脚本 + API 版本 + pkg target」计算指纹，未变化时跳过构建。
  - 使用 `--no-bytecode`，允许在 mac 上交叉打出 Windows 产物；使用 `--compress Brotli`，体积约减少 20MB。
- 首次打包需要从 GitHub 下载 Node 基础二进制（缓存于 `~/.pkg-cache`）。网络受限时先设置代理：`HTTPS_PROXY=http://127.0.0.1:7897 pnpm sidecar:build`。

实测体积（API 4.40.1、node22）：

| 目标                   | 体积    |
| ---------------------- | ------- |
| aarch64-apple-darwin   | 76.7 MB |
| x86_64-apple-darwin    | 79.0 MB |
| x86_64-pc-windows-msvc | 73.5 MB |

### sidecar 协议（`sidecar/ncm-api/src/index.cjs`）

| 方向           | 内容                                                          |
| -------------- | ------------------------------------------------------------- |
| Rust → sidecar | 参数 `--port=<n> --host=127.0.0.1 --parent-pid=<pid>`         |
| sidecar → Rust | stdout 一行 `NCM_API_READY <port>` 表示就绪                   |
| sidecar → Rust | stdout 一行 `NCM_API_ERROR <msg>` 并以非 0 退出，表示启动失败 |

- 上游在 require 阶段会同步读取 `os.tmpdir()/anonymous_token`，文件不存在时会直接崩溃，所以入口先创建这个文件。
- 匿名 token 注册依赖外网，入口最多等待 5s，离线时不阻塞服务启动。
- 只监听 `127.0.0.1`，不对局域网暴露。
- **父进程看护**：每 2s 用 `process.kill(parentPid, 0)` 检查主进程是否存活，主进程不在了就退出，避免主程序被强杀后残留孤儿进程。

### 生命周期（`src-tauri/src/api_server/embedded.rs`）

1. `setup` 阶段绑定 `127.0.0.1:0`，拿到一个空闲端口后拉起 sidecar。
2. 状态通过 `tokio::sync::watch` 广播：`Starting` → `Ready(port)` / `Failed(reason)`。
3. 前端调用 `get_api_endpoint` 时等待状态离开 `Starting`，超时时间为 20s。
4. 进程意外退出后换端口重启，最多 3 次；就绪后重置计数。每次就绪都会 emit `api://endpoint-changed`，前端据此刷新缓存的 baseURL。
5. `RunEvent::Exit` 时设置 `shutting_down` 标记并 kill 子进程。
6. Windows 下 shell 插件以 `CREATE_NO_WINDOW` 启动子进程，不会弹出控制台窗口。

## 登录态传递

WebView 的 origin（`tauri://localhost`）和 API（`http://127.0.0.1:<port>`）跨源，浏览器 cookie 行为不可靠，端口变化后也会失效。所以统一由前端保存 cookie 字符串（`stores/user.ts`），再由 `api/http.ts` 以 `cookie` 参数注入：GET 放在 query，POST 放在 body。上游服务端会解析这个参数。

## 已知限制

- `/cloud`（云盘上传）依赖纯 ESM 的 `music-metadata`，pkg 无法打包，内嵌形态下不可用；远程形态不受影响。
- 不支持 `universal-apple-darwin`：pkg 把 payload 追加在 Mach-O 尾部，`lipo` 合并会破坏它。macOS 需要分别打 arm64 和 x64 包（CI 已按此配置）。
- 升级 API 版本时修改 `sidecar/ncm-api/package.json` 中的锁定版本，指纹变化后会自动重新打包。
