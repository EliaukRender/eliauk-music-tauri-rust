/**
 * 由 design/icons/*.svg 生成全部应用与托盘图标。
 * - app-icon.svg：满版，用于 Windows/Linux 与应用内 Logo
 * - app-icon-macos.svg：按 macOS 图标网格留白，仅取其 icon.icns
 * - tray-template.svg：macOS 菜单栏单色 template 图标
 * - tray.svg：Windows 托盘彩色图标
 */
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const designDir = path.join(root, 'design/icons')
const iconsDir = path.join(root, 'src-tauri/icons')
const trayDir = path.join(iconsDir, 'tray')
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'eliauk-icons-'))

function tauriIcon(svg, out, pngSizes) {
  const args = ['tauri', 'icon', path.join(designDir, svg), '-o', out]
  if (pngSizes) args.push('--png', pngSizes)
  execFileSync('pnpm', args, { cwd: root, stdio: 'inherit', shell: process.platform === 'win32' })
}

tauriIcon('app-icon.svg', iconsDir)
// 仅桌面端，移动端图标不入库
fs.rmSync(path.join(iconsDir, 'android'), { recursive: true, force: true })
fs.rmSync(path.join(iconsDir, 'ios'), { recursive: true, force: true })

tauriIcon('app-icon-macos.svg', path.join(tmp, 'mac'))
fs.copyFileSync(path.join(tmp, 'mac/icon.icns'), path.join(iconsDir, 'icon.icns'))

fs.mkdirSync(trayDir, { recursive: true })
tauriIcon('tray-template.svg', path.join(tmp, 'tray-template'), '22,44')
fs.copyFileSync(path.join(tmp, 'tray-template/22x22.png'), path.join(trayDir, 'tray-template.png'))
fs.copyFileSync(
  path.join(tmp, 'tray-template/44x44.png'),
  path.join(trayDir, 'tray-template@2x.png'),
)

tauriIcon('tray.svg', path.join(tmp, 'tray'), '32')
fs.copyFileSync(path.join(tmp, 'tray/32x32.png'), path.join(trayDir, 'tray.png'))

fs.copyFileSync(path.join(designDir, 'app-icon.svg'), path.join(root, 'public/logo.svg'))
fs.rmSync(tmp, { recursive: true, force: true })
console.log('[icons] 图标已生成')
