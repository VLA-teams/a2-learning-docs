<script setup>
import { computed } from 'vue'
import { useData, withBase } from 'vitepress'

const { page, frontmatter, theme } = useData()

const isHome = computed(() => frontmatter.value.pageClass === 'lab-home')
const year = new Date().getFullYear()
const repoLink = computed(() => theme.value.socialLinks?.find((item) => item.icon === 'github')?.link || '')
const editLink = computed(() => {
  const pattern = theme.value.editLink?.pattern
  return pattern ? pattern.replace(':path', page.value.relativePath) : ''
})
</script>

<template>
  <div class="lab-page-end">
    <div v-if="!isHome" class="lab-feedback">
      <div class="lab-feedback-text">
        <b>本页有误或需要补充？</b>
        直接修改并提交 PR，审核合并后网站会自动更新。
      </div>
      <a v-if="editLink" class="lab-feedback-btn" :href="editLink" target="_blank" rel="noreferrer">在 GitHub 上编辑</a>
      <a class="lab-feedback-link" :href="withBase('/contribute')">如何更新文档 →</a>
    </div>
    <div class="lab-footer">
      <span>© {{ year }} 具身智能实验室 · A2 学习与开发文档中心</span>
      <a :href="withBase('/contribute')">如何更新文档</a>
      <a :href="withBase('/deployment')">发布与部署</a>
      <a :href="withBase('/updates/changelog')">更新日志</a>
      <a v-if="repoLink" :href="repoLink" target="_blank" rel="noreferrer">GitHub 仓库 ↗</a>
      <span class="lab-footer-spacer">VitePress · GitHub Pages</span>
    </div>
  </div>
</template>
