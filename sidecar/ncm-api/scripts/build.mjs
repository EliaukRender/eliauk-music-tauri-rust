/**
 * 将 sidecar 打包为 Tauri externalBin 要求的 `ncm-api-<target-triple>[.exe]`。
 *
 * 目标三元组优先级：--target=<triple> > TAURI_ENV_TARGET_TRIPLE（tauri 的 before*Command 注入）> rustc 宿主。
 * 产物与构建指纹一致时跳过，--force 强制重打。
 */
import { execFileSync, spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import fs from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const sidecarDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const binariesDir = path.resolve(sidecarDir, '../../src-tauri/binaries')
const entry = path.join(sidecarDir, 'src/index.cjs')
const API_DIR = 'node_modules/@neteasecloudmusicapienhanced/api'
const NODE_RANGE = 'node22'

// universal-apple-darwin 不支持：pkg 产物把 payload 追加在 Mach-O 尾部，lipo 合并会丢失
const PKG_TARGETS = {
  'aarch64-apple-darwin': 'macos-arm64',
  'x86_64-apple-darwin': 'macos-x64',
  'x86_64-pc-windows-msvc': 'win-x64',
  'aarch64-pc-windows-msvc': 'win-arm64',
  'x86_64-unknown-linux-gnu': 'linux-x64',
  'aarch64-unknown-linux-gnu': 'linux-arm64',
}

function readArg(name) {
  const prefix = `--${name}=`
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length)
}

function hostTriple() {
  const output = execFileSync('rustc', ['-vV'], { encoding: 'utf-8' })
  return output.match(/^host: (.+)$/m)[1].trim()
}

const triple = readArg('target') || process.env.TAURI_ENV_TARGET_TRIPLE || hostTriple()
const pkgTarget = PKG_TARGETS[triple]
if (!pkgTarget) {
  console.error(`[sidecar] 不支持的目标平台: ${triple}`)
  process.exit(1)
}

const ext = triple.includes('windows') ? '.exe' : ''
const output = path.join(binariesDir, `ncm-api-${triple}${ext}`)
const stampFile = `${output}.stamp`

const apiVersion = require(path.join(sidecarDir, API_DIR, 'package.json')).version
const fingerprint = createHash('sha256')
  .update(fs.readFileSync(entry))
  .update(fs.readFileSync(fileURLToPath(import.meta.url)))
  .update(`${apiVersion}|${NODE_RANGE}-${pkgTarget}`)
  .digest('hex')

if (
  !process.argv.includes('--force') &&
  fs.existsSync(output) &&
  fs.existsSync(stampFile) &&
  fs.readFileSync(stampFile, 'utf-8') === fingerprint
) {
  console.log(`[sidecar] ${path.basename(output)} 已是最新，跳过构建`)
  process.exit(0)
}

fs.mkdirSync(binariesDir, { recursive: true })

const pkgConfig = path.join(sidecarDir, '.pkg.config.json')
fs.writeFileSync(
  pkgConfig,
  JSON.stringify({
    pkg: {
      scripts: [`${API_DIR}/module/*.js`, `${API_DIR}/util/*.js`, `${API_DIR}/plugins/*.js`],
      assets: [`${API_DIR}/data/**/*`, `${API_DIR}/public/**/*`, `${API_DIR}/util/*.json`],
    },
  }),
)

const pkgPkgJson = require.resolve('@yao-pkg/pkg/package.json')
const pkgBin = path.resolve(path.dirname(pkgPkgJson), require(pkgPkgJson).bin.pkg)

console.log(`[sidecar] 构建 ${triple} (${NODE_RANGE}-${pkgTarget}) ...`)
// 跨平台/跨架构打包必须关闭 bytecode，否则需要在目标架构上执行 V8 编译
const result = spawnSync(
  process.execPath,
  [
    pkgBin,
    entry,
    '--config',
    pkgConfig,
    '--targets',
    `${NODE_RANGE}-${pkgTarget}`,
    '--no-bytecode',
    '--public-packages',
    '*',
    '--public',
    '--compress',
    'Brotli',
    '--output',
    output,
  ],
  { cwd: sidecarDir, stdio: 'inherit' },
)
fs.rmSync(pkgConfig, { force: true })

if (result.status !== 0) {
  console.error('[sidecar] 打包失败')
  process.exit(result.status ?? 1)
}

fs.writeFileSync(stampFile, fingerprint)
const sizeMb = (fs.statSync(output).size / 1024 / 1024).toFixed(1)
console.log(`[sidecar] 完成: ${path.relative(process.cwd(), output)} (${sizeMb} MB)`)
