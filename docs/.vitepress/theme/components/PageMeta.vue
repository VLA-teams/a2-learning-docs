<script setup>
import { computed } from 'vue'
import { useData, withBase } from 'vitepress'
import catalog from '../catalog.json'
const { page, frontmatter } = useData()
const group = computed(() => catalog.find(item => page.value.relativePath.startsWith(item.path + '/')))
const labels = { draft: '待完善', review: '待复核', verified: '已验证' }
</script>
<template>
  <div class="lab-breadcrumb" aria-label="面包屑">
    <a :href="withBase('/')">文档中心</a><span aria-hidden="true">/</span>
    <span v-if="group">{{ group.title }}</span><span v-else>阅读指南</span>
  </div>
  <div v-if="frontmatter.status" class="lab-page-meta">
    <span class="lab-status" :data-status="frontmatter.status"><i></i>{{ labels[frontmatter.status] || frontmatter.status }}</span>
    <span v-if="frontmatter.author">维护：{{ frontmatter.author }}</span>
  </div>
</template>
