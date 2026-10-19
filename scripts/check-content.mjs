import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { resolve, dirname, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const docs = resolve(root, 'docs')
const catalog = JSON.parse(readFileSync(resolve(docs, '.vitepress/theme/catalog.json'), 'utf8'))

/** 收集所有问题，按「类型」分组，最后统一输出带修复指引的报告 */
const problems = []
const add = (kind, file, detail, hint) => problems.push({ kind, file, detail, hint })

const walk = dir => readdirSync(dir, { withFileTypes: true }).flatMap(x => {
  if (x.name.startsWith('.') || x.name === 'public') return []
  const file = resolve(dir, x.name)
  return x.isDirectory() ? walk(file) : x.name.endsWith('.md') ? [file] : []
})
const pages = walk(docs)
const show = f => relative(root, f).split('\\').join('/')

function checkLink(url, file) {
  const path = url.split(/[?#]/)[0]
  if (!path || /^(https?:|mailto:)/.test(path) || !path.startsWith('/')) return
  const target = resolve(docs, '.' + path)
  const publicTarget = resolve(docs, 'public', '.' + path)
  if (![target + '.md', resolve(target, 'index.md'), publicTarget].some(existsSync)) {
    add('deadlink', show(file), url,
      '站内链接要写成 /setup/ros2-humble 这样的路径（不带 .md），并确认目标文件真的存在')
  }
}

for (const file of pages) {
  const content = readFileSync(file, 'utf8')
  const rel = show(file)

  // 0) BOM 检查：Windows 记事本等编辑器会在开头写入 BOM，
  //    导致 ^--- 匹配不到，页面被误判为「缺少 frontmatter」。
  const hasBOM = content.charCodeAt(0) === 0xfeff
  if (hasBOM) {
    add('bom', rel, '文件开头有 UTF-8 BOM（不可见字符）',
      '用 VS Code 打开，右下角编码改为 "UTF-8"（不要选 UTF-8 with BOM）后另存；或在文件开头手动删掉多余字符')
  }
  const body0 = hasBOM ? content.slice(1) : content

  // 1) frontmatter 检查：必须从第 1 行开始
  const fmMatch = body0.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  if (!fmMatch) {
    add('frontmatter', rel, '文件开头缺少 frontmatter',
      '在文件第一行插入下面 7 行（--- 之间的 5 个字段必须改成本页的真实信息）')
    // 仍然继续检查链接，避免一个文件只报一个问题
  } else {
    const fm = fmMatch[1]

    // 2) 必填字段：首页（index.md）不需要状态条，豁免 author/status/date
    const isHome = /[\\/]docs[\\/]index\.md$/.test(file)
    const need = isHome ? ['title', 'description'] : ['title', 'description', 'author', 'status', 'date']
    const missing = need.filter(k => !new RegExp('^' + k + '\\s*:', 'm').test(fm))
    if (missing.length) {
      add('field', rel, '缺少字段：' + missing.join('、'),
        '补齐这些字段，可参照 templates/page.md')
    }

    // 3) status 取值检查
    const st = fm.match(/^status\s*:\s*['"]?([^'"\r\n]+)['"]?\s*$/m)
    if (st && !['draft', 'review', 'verified'].includes(st[1].trim())) {
      add('status', rel, 'status 取值 "' + st[1].trim() + '" 不合法',
        '只能是 draft（待完善）/ review（待复核）/ verified（已验证）')
    }

    // 4) date 格式检查
    const dt = fm.match(/^date\s*:\s*['"]?([^'"\r\n]+)['"]?\s*$/m)
    if (dt && !/^\d{4}-\d{2}-\d{2}$/.test(dt[1].trim())) {
      add('date', rel, 'date 格式是 "' + dt[1].trim() + '"',
        '写成 2026-10-19 这种 YYYY-MM-DD 格式')
    }
  }

  // 5) 文件名检查：中文或空格会影响网址
  const base = file.split(/[\\/]/).pop()
  if (/[^\x00-\x7F]/.test(base) || /\s/.test(base)) {
    add('filename', rel, '文件名含中文或空格',
      '改成英文短横线命名，例如 a2-5090-recovery.md；中文名会让网址变成 %E4%B8%AD%E6%96%87')
  }

  // 6) 站内链接（无论 frontmatter 是否通过都要查）
  //    先剥掉两类「示例代码」，否则文档里演示写法用的链接会被误报为死链：
  //    1) ~~~ 围起来的代码块；
  //    2) `行内代码`，例如表格里写的 `![说明](/images/x.png)`。
  const body = body0
    .replace(/~~~[\s\S]*?~~~/g, '')
    .replace(/`[^`\n]*`/g, '')
  for (const match of body.matchAll(/\]\(([^\s)]+)\)/g)) checkLink(match[1], file)
}

for (const group of catalog) for (const item of group.items) checkLink(item.link, 'catalog.json')

// 7) 页面是否落在可被侧栏收录的位置
//    catalog.json 由 build-catalog.mjs 自动生成，递归扫描六个栏目目录；
//    docs/ 根目录的说明页和 guide/（快速开始）在 config.mts 里单独注册，
//    因此这里对它们豁免，其余位置的新页面会提示。
const GROUP_DIRS = ['platform', 'setup', 'simulation', 'vla', 'handbook', 'updates']
const SIDEBAR_EXTRA = ['docs/index.md', 'docs/contribute.md', 'docs/deployment.md', 'docs/guide/index.md']
for (const file of pages) {
  const rel = show(file)
  const top = rel.replace(/^docs\//, '').split('/')[0]
  const isGroupIndex = GROUP_DIRS.includes(top) && rel.endsWith('/index.md')
  if (!GROUP_DIRS.includes(top) && !SIDEBAR_EXTRA.includes(rel) && !isGroupIndex) {
    add('location', rel, '不在六个栏目目录下，侧栏和首页都不会显示',
      '把文件移到对应的栏目目录（platform / setup / simulation / vla / handbook / updates），再写好 frontmatter')
  }
}

/** 输出报告 */
if (problems.length) {
  const byKind = {}
  for (const p of problems) (byKind[p.kind] ||= []).push(p)

  const titles = {
    bom: '文件带 BOM（会导致 frontmatter 失效）',
    frontmatter: '缺少 frontmatter（最常见）',
    field: 'frontmatter 字段不全',
    status: 'status 取值错误',
    date: 'date 日期格式错误',
    filename: '文件名不规范',
    deadlink: '站内链接指向不存在的页面',
    location: '页面不在栏目目录下（侧栏看不到）',
  }

  console.error('\n内容检查未通过，共 ' + problems.length + ' 个问题：\n')
  for (const [kind, list] of Object.entries(byKind)) {
    console.error('【' + (titles[kind] || kind) + '】' + list.length + ' 处')
    for (const p of list) {
      console.error('  ✗ ' + p.file)
      console.error('      ' + p.detail)
    }
    console.error('  → 怎么改：' + list[0].hint)
    if (kind === 'frontmatter' || kind === 'field') {
      console.error('')
      console.error('  把下面这段放在文件最开头（第一行就是 ---）：')
      console.error('')
      console.error('    ---')
      console.error('    title: "页面标题"')
      console.error('    description: "一句话说明这一页解决什么问题"')
      console.error('    author: 你的名字')
      console.error('    status: draft')
      console.error('    date: ' + new Date().toISOString().slice(0, 10))
      console.error('    ---')
    }
    console.error('')
  }
  console.error('提示：模板在 templates/page.md，完整说明见 docs/contribute.md 的「写作约定」。')
  console.error('本地可先运行 npm run check 自检，通过后再推送，避免 PR 检查失败。\n')
  process.exitCode = 1
} else {
  console.log('内容检查通过：' + pages.length + ' 个页面，' + catalog.length + ' 个栏目。构建继续校验死链。')
}
