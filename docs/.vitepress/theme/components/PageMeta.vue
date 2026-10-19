<script setup>
import { computed } from 'vue'
import { useData, withBase } from 'vitepress'
import catalog from '../catalog.json'

const { page, frontmatter, theme } = useData()

const labels = { draft: '待完善', review: '待复核', verified: '已验证' }
const descriptions = {
  draft: '结构已建立，操作步骤和实测结果待补充；设备参数与命令以官方资料和实机记录为准。',
  review: '内容已整理，等待另一位成员核对版本、步骤和结果。',
  verified: '已在对应设备和版本上验证通过，保留可追溯的日志与截图。',
}

const isHome = computed(() => frontmatter.value.pageClass === 'lab-home')
const status = computed(() => frontmatter.value.status)
const group = computed(() => catalog.find((item) => page.value.relativePath.startsWith(item.path + '/')))
const author = computed(() => frontmatter.value.author || '文档共建小组')

const dateText = computed(() => {
  const value = frontmatter.value.date
  if (!value) return ''
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return typeof value === 'string' ? value : ''
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
})

const editLink = computed(() => {
  const pattern = theme.value.editLink?.pattern
  return pattern ? pattern.replace(':path', page.value.relativePath) : ''
})
</script>

<template>
  <div v-if="!isHome" class="lab-breadcrumb" aria-label="面包屑">
    <a :href="withBase('/')">文档中心</a>
    <span aria-hidden="true">/</span>
    <span v-if="group">{{ group.title }}</span>
    <span v-else>阅读指南</span>
  </div>

  <div v-if="!isHome && status" class="lab-statusbar" :data-status="status">
    <span class="lab-status-badge" :title="descriptions[status] || ''">{{ labels[status] || status }}</span>
    <span class="lab-status-meta">
      维护人：{{ author }}<template v-if="dateText"><i>·</i>更新于 {{ dateText }}</template>
    </span>
    <a v-if="editLink" class="lab-status-edit" :href="editLink" target="_blank" rel="noreferrer">在 GitHub 上编辑本页 ↗</a>
  </div>
  <p v-if="!isHome && status" class="lab-statusdesc">{{ descriptions[status] }}</p>
</template>
