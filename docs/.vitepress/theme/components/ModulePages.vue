<script setup>
import { computed } from 'vue'
import { useData, withBase } from 'vitepress'
import catalog from '../catalog.json'

const { page } = useData()
const items = computed(() => catalog.find(group => page.value.relativePath.startsWith(group.path + '/'))?.items || [])
</script>

<template>
  <ul v-if="items.length">
    <li v-for="item in items" :key="item.slug">
      <a :href="withBase(item.link)">{{ item.text }}</a><template v-if="item.description">：{{ item.description }}</template>
    </li>
  </ul>
  <p v-else>本栏目暂无文档。</p>
</template>
