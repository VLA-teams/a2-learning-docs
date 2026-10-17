<script setup>
import { withBase } from 'vitepress'
import catalog from '../catalog.json'
</script>
<template>
  <div class="lab-intro">
    <span class="lab-eyebrow">EMBODIED AI · KNOWLEDGE BASE</span>
    <h1>开发文档中心<span class="lab-title-dot">.</span></h1>
    <p>从第一次连接机器人，到完成真实世界的闭环实验。<br class="desktop-break"/>把每一步配置、每一次验证和每一个解决方法，留给下一位同行者。</p>
    <div class="lab-intro-actions">
      <a class="lab-primary" :href="withBase('/platform/agibot-a2')">开始学习 A2 <span aria-hidden="true">→</span></a>
      <a class="lab-secondary" :href="withBase('/contribute')">参与文档编写 <span aria-hidden="true">↗</span></a>
    </div>
    <div class="lab-flow"><span>Markdown 编写</span><b>→</b><span>GitHub 留存</span><b>→</b><span>自动部署</span><b>→</b><span>浏览器阅读</span></div>
  </div>
  <div class="lab-section-heading"><h2 id="学习与开发模块" tabindex="-1">学习与开发模块</h2><span>6 个模块 · 持续共建</span></div>
  <div class="lab-catalog">
    <section v-for="group in catalog" :key="group.path" class="lab-module">
      <div class="lab-module-heading"><span class="lab-module-number">{{ group.number }}</span><h3>{{ group.title }}</h3></div>
      <p>{{ group.description }}</p>
      <ul><li v-for="item in group.items" :key="item.slug"><a :href="withBase(item.link)"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" aria-hidden="true"><rect x="3.5" y="2.5" width="9" height="11" rx="1.5"/><path d="M6 6h4M6 9h3"/></svg><span>{{ item.text }}</span><span class="lab-link-arrow" aria-hidden="true">↗</span></a></li></ul>
    </section>
  </div>
  <div class="lab-bottom-note"><span class="lab-bottom-mark" aria-hidden="true">↳</span><div><strong>知识来自每一次实际验证。</strong><p>新内容通过 Pull Request 审阅后发布；未完成的操作说明会明确标注状态。</p></div><a :href="withBase('/contribute')">了解协作流程 →</a></div>
</template>
