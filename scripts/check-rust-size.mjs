// Rust 没有对应的 lint，按与前端相同的口径（不计空行和注释）检查单文件行数
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('../src-tauri/src', import.meta.url))
/** 与 ESLint max-lines 一致：业务代码 250，测试 400 */
const MAX_LINES = 250
const MAX_TEST_LINES = 400

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) yield* walk(path)
    else if (name.endsWith('.rs')) yield path
  }
}

function countCodeLines(source) {
  return source
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('//')).length
}

const oversized = [...walk(ROOT)]
  .map((path) => ({
    path,
    lines: countCodeLines(readFileSync(path, 'utf8')),
    max: path.endsWith('tests.rs') ? MAX_TEST_LINES : MAX_LINES,
  }))
  .filter(({ lines, max }) => lines > max)

for (const { path, lines, max } of oversized) {
  console.error(`${relative(process.cwd(), path)}: ${lines} 行，超过上限 ${max}`)
}
process.exit(oversized.length ? 1 : 0)
