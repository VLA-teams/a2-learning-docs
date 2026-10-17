import { defineConfig } from 'vitepress'
import catalog from './theme/catalog.json'

// 发布时由 Actions 自动注入真实仓库与 Pages 路径；本地无需填写。
const repository = process.env.GITHUB_REPOSITORY || ''
const segments = (process.env.DOCS_BASE || '/').split('/').filter(Boolean)
const base = '/' + segments.join('/') + (segments.length ? '/' : '')
const repoURL = repository ? 'https://github.com/' + repository : ''

export default defineConfig({
  lang: 'zh-CN', title: '具身智能实验室', titleTemplate: ':title · 开发文档中心',
  description: '机器人平台、环境配置、仿真与运动控制、VLA 模型部署、实验操作手册、版本与更新。',
  base, cleanUrls: true, lastUpdated: true, ignoreDeadLinks: false,
  head: [['link', { rel: 'icon', type: 'image/svg+xml', href: base + 'logo.svg' }]],
  markdown: { lineNumbers: true, image: { lazyLoading: true } },
  themeConfig: {
    logo: '/logo.svg', siteTitle: '具身智能实验室',
    nav: [
      { text: '文档中心', link: '/', activeMatch: '^/(?!updates|contribute)' },
      { text: '更新日志', link: '/updates/changelog', activeMatch: '^/updates/' },
      { text: '参与编写', link: '/contribute' },
      { text: '参考资料', items: [
        { text: '智元 A2 v2.1 官方文档', link: 'https://open.agibot.com/docs/aimdk/a2/v2_1/dev_guide/01-a2_overview' },
        { text: 'VitePress', link: 'https://vitepress.dev/guide/getting-started' }
      ] }
    ],
    sidebar: [
      { text: '阅读指南', items: [{ text: '文档中心概览', link: '/' }, { text: '快速开始', link: '/guide/' }] },
      ...catalog.map(group => ({ text: group.number + ' ' + group.title, collapsed: false,
        items: group.items.map(item => ({ text: item.text, link: item.link })) })),
      { text: '协作与维护', collapsed: true, items: [
        { text: '如何更新文档', link: '/contribute' }, { text: '发布与部署', link: '/deployment' }
      ] }
    ],
    outline: { level: [2,3], label: '本页目录' },
    search: { provider: 'local', options: { translations: {
      button: { buttonText: '搜索文档', buttonAriaLabel: '搜索文档' },
      modal: { noResultsText: '没有找到相关文档', resetButtonTitle: '清除搜索',
        footer: { selectText: '打开', navigateText: '切换', closeText: '关闭' } }
    } } },
    editLink: repoURL ? { pattern: repoURL + '/edit/main/docs/:path', text: '在 GitHub 上编辑此页' } : undefined,
    socialLinks: repoURL ? [{ icon: 'github', link: repoURL }] : [],
    docFooter: { prev: '上一篇', next: '下一篇' },
    lastUpdated: { text: '最后更新', formatOptions: { dateStyle: 'medium' } },
    sidebarMenuLabel: '文档目录', returnToTopLabel: '返回顶部',
    darkModeSwitchLabel: '主题', lightModeSwitchTitle: '切换浅色模式', darkModeSwitchTitle: '切换深色模式',
    notFound: { title: '页面未找到', quote: '请从文档目录或搜索重新查找。', linkLabel: '返回文档中心', linkText: '返回文档中心' }
  }
})
