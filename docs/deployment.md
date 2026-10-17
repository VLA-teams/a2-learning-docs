---
title: "发布与部署"
description: "发布与部署：学习、开发与验证记录"
author: 文档共建小组
status: review
date: 2026-10-17
---

# 发布与部署


## 第一次上线

1. GitHub 新建仓库，例如 a2-learning-docs；GitHub Free 的 Pages 方案使用公开仓库。
2. 提交本项目到 main 分支。
3. Settings → Pages → Build and deployment → Source 选择 GitHub Actions。
4. 在 Actions 运行 Deploy documentation，或推送一次提交。
5. 完成后从 Pages 设置或部署结果打开真实网址。

工作流已声明所需的 contents: read、pages: write、id-token: write 权限，通常无需把仓库全局权限改为写权限；组织策略可能需要管理员额外允许。

## 地址与路径

构建读取 configure-pages 返回的路径，个人主页、项目页与自定义域名的前缀由 Pages 设置决定。仓库地址由 GITHUB_REPOSITORY 自动注入，无需手动替换用户名。

本地默认路径为 /。测试项目页前缀时，在 PowerShell 执行：

~~~powershell
$env:DOCS_BASE = '/a2-learning-docs/'
npm run docs:build
npm run docs:preview
~~~

## 日常发布

Markdown → 分支 / PR → 检查与构建 → 审阅合并 main → 自动部署 → 浏览器阅读。

公开 Pages 的阅读者无需登录。若要求仅小组可见，需要另选具有访问控制的托管方式。

## 常见问题

| 现象 | 检查 |
| --- | --- |
| 构建失败 | 看 Actions 第一处错误，修正链接或 Markdown / Vue 语法 |
| 部署失败 | 确认 Pages Source 和组织部署策略 |
| 页面无样式 | 确认 DOCS_BASE 与实际路径一致 |
| 编辑链接不显示 | 本地未绑定仓库时是正常行为 |
| 网站没更新 | 确认合并到 main 且 Actions 已完成 |

## 回滚

对问题提交创建 Revert PR，审核合并后自动重新部署。Git 保留原始与回滚记录。
