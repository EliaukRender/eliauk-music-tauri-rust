/**
 * NCM API sidecar 入口。
 *
 * 与 Rust 端的约定（见 src-tauri/src/api_server/embedded.rs）：
 * - 参数：--port=<n> --host=<ip> --parent-pid=<pid>
 * - 监听成功后向 stdout 输出一行 `NCM_API_READY <port>`
 * - 启动失败输出 `NCM_API_ERROR <message>` 并以非 0 退出
 */
const fs = require('fs')
const os = require('os')
const path = require('path')

const READY_SIGNAL = 'NCM_API_READY'
const ERROR_SIGNAL = 'NCM_API_ERROR'

function readArg(name, fallback) {
  const prefix = `--${name}=`
  const hit = process.argv.find((arg) => arg.startsWith(prefix))
  return hit ? hit.slice(prefix.length) : fallback
}

const port = Number(readArg('port', process.env.PORT || '30488'))
const host = readArg('host', '127.0.0.1')
const parentPid = Number(readArg('parent-pid', '0'))

// 上游模块在 require 阶段就会同步读取该文件，必须先于任何 require 创建
const tokenPath = path.resolve(os.tmpdir(), 'anonymous_token')
if (!fs.existsSync(tokenPath)) fs.writeFileSync(tokenPath, '', 'utf-8')

// 主进程被强杀时 Rust 端来不及回收子进程，这里自行退出避免残留
function watchParent() {
  if (!parentPid) return
  setInterval(() => {
    try {
      process.kill(parentPid, 0)
    } catch (error) {
      if (error.code === 'ESRCH') process.exit(0)
    }
  }, 2000).unref()
}

async function main() {
  watchParent()

  // 匿名 token 注册依赖外网，离线时不能阻塞服务启动
  const generateConfig = require('@neteasecloudmusicapienhanced/api/generateConfig')
  await Promise.race([
    generateConfig().catch(() => undefined),
    new Promise((resolve) => setTimeout(resolve, 5000)),
  ])

  const { serveNcmApi } = require('@neteasecloudmusicapienhanced/api/server')
  const app = await serveNcmApi({ port, host, checkVersion: false })
  app.server.once('listening', () => console.log(`${READY_SIGNAL} ${port}`))
  app.server.once('error', (error) => {
    console.log(`${ERROR_SIGNAL} ${error.message}`)
    process.exit(1)
  })
}

main().catch((error) => {
  console.log(`${ERROR_SIGNAL} ${error && error.message}`)
  process.exit(1)
})
