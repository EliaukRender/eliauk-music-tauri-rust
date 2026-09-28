// 版本号分散在前端、Tauri、Cargo 三处，统一由本脚本修改和校验
//   node scripts/version.mjs check                        校验各处版本一致且 CHANGELOG 有对应条目
//   node scripts/version.mjs <x.y.z|major|minor|patch>    升级版本并把「未发布」归入新版本
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const root = (path) => fileURLToPath(new URL(`../${path}`, import.meta.url))
const REPO_URL = 'https://github.com/EliaukRender/eliauk-music-tauri-rust'
const CHANGELOG = root('CHANGELOG.md')
const UNRELEASED = '## [未发布]'
const SEMVER_RE = /^\d+\.\d+\.\d+$/

/** 用正则替换而不是重新序列化，保留原文件格式 */
const TARGETS = [
  { file: 'package.json', re: /("version": ")([^"]+)(")/ },
  { file: 'src-tauri/tauri.conf.json', re: /("version": ")([^"]+)(")/ },
  { file: 'src-tauri/Cargo.toml', re: /^(version = ")([^"]+)(")/m },
  // Cargo.lock 也记录本包版本，不同步会在下次 cargo 构建时产生额外改动
  { file: 'src-tauri/Cargo.lock', re: /(name = "eliauk-music"\nversion = ")([^"]+)(")/ },
]

function fail(message) {
  console.error(message)
  process.exit(1)
}

function readVersions() {
  return TARGETS.map(({ file, re }) => {
    const match = readFileSync(root(file), 'utf8').match(re)
    if (!match) fail(`${file}: 未找到版本号`)
    return { file, version: match[2] }
  })
}

function compare(a, b) {
  const [pa, pb] = [a, b].map((v) => v.split('.').map(Number))
  for (let i = 0; i < 3; i++) if (pa[i] !== pb[i]) return pa[i] - pb[i]
  return 0
}

function resolveNext(current, arg) {
  const [major, minor, patch] = current.split('.').map(Number)
  if (arg === 'major') return `${major + 1}.0.0`
  if (arg === 'minor') return `${major}.${minor + 1}.0`
  if (arg === 'patch') return `${major}.${minor}.${patch + 1}`
  if (!SEMVER_RE.test(arg)) fail(`无效版本号：${arg}`)
  if (compare(arg, current) <= 0) fail(`新版本 ${arg} 必须大于当前版本 ${current}`)
  return arg
}

function today() {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function releaseChangelog(current, next) {
  const text = readFileSync(CHANGELOG, 'utf8')
  const start = text.indexOf(UNRELEASED)
  if (start < 0) fail(`CHANGELOG.md 缺少「${UNRELEASED}」段落`)
  const bodyStart = start + UNRELEASED.length
  const bodyEnd = text.indexOf('\n## ', bodyStart)
  if (!text.slice(bodyStart, bodyEnd < 0 ? undefined : bodyEnd).trim()) {
    fail('CHANGELOG.md「未发布」下没有内容，请先补充本次改动')
  }
  const released = `${text.slice(0, bodyStart)}\n\n## [${next}] - ${today()}${text.slice(bodyStart)}`
  const links = released.replace(
    `[未发布]: ${REPO_URL}/compare/v${current}...HEAD`,
    `[未发布]: ${REPO_URL}/compare/v${next}...HEAD\n[${next}]: ${REPO_URL}/compare/v${current}...v${next}`,
  )
  writeFileSync(CHANGELOG, links)
}

function check() {
  const versions = readVersions()
  const [{ version }] = versions
  const mismatched = versions.filter((v) => v.version !== version)
  if (mismatched.length) {
    fail(`版本号不一致：\n${versions.map((v) => `  ${v.file}: ${v.version}`).join('\n')}`)
  }
  if (!readFileSync(CHANGELOG, 'utf8').includes(`## [${version}]`)) {
    fail(`CHANGELOG.md 缺少 ${version} 的条目`)
  }
  console.log(`版本 ${version} 校验通过`)
}

function bump(arg) {
  const [{ version: current }] = readVersions()
  const next = resolveNext(current, arg)
  releaseChangelog(current, next)
  for (const { file, re } of TARGETS) {
    const path = root(file)
    writeFileSync(path, readFileSync(path, 'utf8').replace(re, `$1${next}$3`))
  }
  console.log(`${current} → ${next}，已更新 ${TARGETS.map((t) => t.file).join('、')}、CHANGELOG.md`)
}

const [arg] = process.argv.slice(2)
if (!arg) fail('用法：node scripts/version.mjs check | <x.y.z|major|minor|patch>')
if (arg === 'check') check()
else bump(arg)
