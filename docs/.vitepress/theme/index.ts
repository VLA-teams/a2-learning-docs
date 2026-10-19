import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import { h } from 'vue'
import LabHeader from './components/LabHeader.vue'
import PageMeta from './components/PageMeta.vue'
import PageEnd from './components/PageEnd.vue'
import LabHome from './components/LabHome.vue'
import ModulePages from './components/ModulePages.vue'
import './custom.css'

export default {
  extends: DefaultTheme,
  Layout: () => h(DefaultTheme.Layout, null, {
    'sidebar-nav-before': () => h(LabHeader),
    'doc-before': () => h(PageMeta),
    'doc-after': () => h(PageEnd)
  }),
  enhanceApp({ app }) {
    app.component('LabHome', LabHome)
    app.component('ModulePages', ModulePages)
  }
} satisfies Theme
