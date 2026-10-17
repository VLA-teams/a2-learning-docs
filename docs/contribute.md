---
title: "如何更新文档"
description: "如何更新文档：学习、开发与验证记录"
author: 文档共建小组
status: review
date: 2026-10-17
---

# 如何更新文档


每页对应一个 Markdown 文件。通过 Pull Request（PR）审阅合并，GitHub 保存历史，合并 main 后自动发布。

## 网页直接编辑

1. 在已发布的页面底部点击「在 GitHub 上编辑此页」。
2. 登录后修改；有写权限的成员创建分支，无写权限者可以通过 fork 提交 PR。
3. 填写提交说明，选择新建分支并创建 PR。
4. 等自动检查通过，请另一位成员审阅。
5. 合并后查看 Actions 部署结果，完成后刷新网站。

本地未绑定仓库时不显示编辑链接；GitHub Actions 发布时会自动生成。

## 本地编写

安装 Node.js 22 和 Git，在克隆的项目目录运行：

~~~bash
npm ci
git switch -c docs/my-topic
npm run docs:dev
~~~

编辑后检查、提交并创建 PR：

~~~bash
npm run check
git add docs
git commit -m "docs: 补充实验记录"
git push -u origin docs/my-topic
~~~

## 新增页面

1. 把 templates/page.md 复制到对应内容目录。
2. 修改标题、维护人、日期和状态，填写真实步骤与证据。
3. 在 docs/.vitepress/theme/catalog.json 对应栏目增加条目。左侧目录和首页卡片共用它。
4. 图片放在 docs/public/images/，正文用 /images/文件名.png 引用。
5. 检查并提交 PR。

## 团队权限

建议使用小组 GitHub Organization：管理员负责设置，其余成员给予 Write 权限。保护 main：要求通过 PR 合并、至少一人批准及 check 状态检查通过。

.github/CODEOWNERS.example 替换真实用户名并改名为 CODEOWNERS 后启用。自动分配审阅人并不限制文件编辑权限，应配合分支保护与 Code Owner 审阅要求。

## 写作约定

注明实际版本，把未验证内容标为待完善。凭据不提交到仓库，大体积数据和视频存到小组存储，在文档记录索引。
