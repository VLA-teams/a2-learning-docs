// 自动生成 docs/.vitepress/theme/catalog.json
//
// 规则：
//   - 六个栏目（platform/setup/simulation/vla/handbook/updates）由下方 GROUPS 固定，
//     编号和栏目名不随文件变化。
//   - 栏目下的页面（包括子目录）通过递归扫描 .md 自动发现，无需手工登记。
//   - 排序依据 frontmatter 的 order（数字，小的在前）；没写 order 的排在最后、按文件名排序。
//   - 页面标题取 frontmatter 的 title，摘要取 description。
//   - 栏目根目录的 index.md 是概览页，不进列表；子目录的 index.md 正常收录。
//
// 组员只要新建 md 并写好 frontmatter，构建时就会自动出现在侧栏和首页。

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const docs = resolve(root, 'docs')
const outFile = resolve(docs, '.vitepress/theme/catalog.json')

/** 栏目定义：编号、标题、简介固定在这里 */
const GROUPS = [
  { path: 'platform', number: '01', title: '机器人平台', description: '了解设备，再开始开发。' },
  { path: 'setup', number: '02', title: '环境配置', description: '从开发机到机器人，打通基础链路。' },
  { path: 'simulation', number: '03', title: '仿真与运动控制', description: '先在仿真中验证，再迁移到实机。' },
  { path: 'vla', number: '04', title: 'VLA 模型部署', description: '连接观测、模型推理与机器人动作。' },
  { path: 'handbook', number: '05', title: '实验操作手册', description: '让下一位同学能够复现实验。' },
  { path: 'updates', number: '06', title: '版本与更新', description: '让变更、问题和进展都有迹可循。' },
]

/** 解析 frontmatter 里的顶层 key: value（够用即可，不引入 yaml 依赖） */
function parseFrontmatter(content) {
  // 去掉 UTF-8 BOM：Windows 上的记事本、部分编辑器会在文件开头写入 BOM，
  // 那样 ^--- 就匹配不到，页面会被当成「没有 frontmatter」而丢失。
  if (content.charCodeAt(0) === 0xfeff) content = content.slice(1)
  const m = content.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  if (!m) return null
  const data = {}
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z][\w-]*)\s*:\s*(.*)$/)
    if (!kv) continue
    let v = kv[2].trim()
    // 去掉成对引号
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1)
    }
    data[kv[1]] = v
  }
  return data
}

/** 返回相对栏目根目录的页面路径；忽略隐藏目录与符号链接。 */
function pageFiles(dir, prefix = '') {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    if (entry.name.startsWith('.')) return []
    const name = prefix + entry.name
    if (entry.isDirectory()) return pageFiles(resolve(dir, entry.name), name + '/')
    return entry.isFile() && entry.name.endsWith('.md') && name !== 'index.md' ? [name] : []
  })
}

/** 递归扫描一个栏目目录，返回条目数组（仍平铺在该栏目下）。 */
function collect(groupPath) {
  const dir = resolve(docs, groupPath)
  if (!existsSync(dir)) return []

  const items = []
  for (const name of pageFiles(dir)) {
    const file = resolve(dir, name)
    const content = readFileSync(file, 'utf8')
    const fm = parseFrontmatter(content)

    // 没有 frontmatter 的页面交给 check-content.mjs 报错，这里先跳过
    if (!fm) continue

    const slug = name.replace(/\.md$/, '')
    const order = fm.order !== undefined && fm.order !== '' ? Number(fm.order) : NaN

    items.push({
      slug,
      text: fm.title || slug,
      description: fm.description || '',
      link: '/' + groupPath + '/' + slug.replace(/\/index$/, '/'),
      _order: Number.isFinite(order) ? order : Infinity,
      _name: name,
    })
  }

  // 有 order 的按 order 升序；没 order 的统一排后面，按文件名升序
  items.sort((a, b) => {
    if (a._order !== b._order) return a._order - b._order
    return a._name.localeCompare(b._name, 'zh-CN')
  })

  return items.map(({ slug, text, description, link }) => ({ slug, text, description, link }))
}

const catalog = GROUPS.map(g => ({
  path: g.path,
  number: g.number,
  title: g.title,
  description: g.description,
  items: collect(g.path),
}))

writeFileSync(outFile, JSON.stringify(catalog, null, 2) + '\n', 'utf8')

const total = catalog.reduce((n, g) => n + g.items.length, 0)
console.log('catalog.json 已生成：' + catalog.length + ' 个栏目，' + total + ' 个条目。')
