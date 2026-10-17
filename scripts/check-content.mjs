import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const docs = resolve(root, 'docs')
const catalog = JSON.parse(readFileSync(resolve(docs, '.vitepress/theme/catalog.json'), 'utf8'))
const errors = []
const walk = dir => readdirSync(dir, { withFileTypes: true }).flatMap(x => {
  if (x.name.startsWith('.') || x.name === 'public') return []
  const file = resolve(dir, x.name)
  return x.isDirectory() ? walk(file) : x.name.endsWith('.md') ? [file] : []
})
const pages = walk(docs)
function checkLink(url, file) {
  const path = url.split(/[?#]/)[0]
  if (!path || /^(https?:|mailto:)/.test(path) || !path.startsWith('/')) return
  const target = resolve(docs, '.' + path)
  const publicTarget = resolve(docs, 'public', '.' + path)
  if (![target + '.md', resolve(target, 'index.md'), publicTarget].some(existsSync)) errors.push(file + ': 链接不存在 ' + url)
}
for (const file of pages) {
  const content = readFileSync(file, 'utf8')
  if (!/^---\r?\n[\s\S]*?\r?\n---/.test(content)) errors.push(file + ': 缺少 frontmatter')
  const body = content.replace(/~~~[\s\S]*?~~~/g, '')
  for (const match of body.matchAll(/\]\(([^\s)]+)\)/g)) checkLink(match[1], file)
}
for (const group of catalog) for (const item of group.items) checkLink(item.link, 'catalog.json')
if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1 }
else console.log('内容检查通过：' + pages.length + ' 个页面，' + catalog.length + ' 个栏目。构建继续校验死链。')
