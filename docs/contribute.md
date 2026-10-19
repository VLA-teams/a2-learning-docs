---
title: "如何更新文档"
description: "用 GitHub 网页修改文档、提交 PR 并完成审核发布，不需要安装 Git 或 Node.js。"
author: 文档共建小组
status: review
date: 2026-10-17
---

# 如何更新文档

推荐所有组员使用 **GitHub 网页** 修改文档，不需要安装 Git、Node.js 或任何编辑软件。只要有自己的 GitHub 账号，在浏览器里就能完成。

整个流程：
~~~text
接受仓库邀请 → 网页编辑 Markdown → 提交到自己的分支并创建 PR
→ 自动检查 → 维护者审核合并 → 网站自动发布
~~~

::: info 当前阶段：先只修改已有页面
新增页面需要同时修改 `docs/.vitepress/theme/catalog.json` 才会出现在左侧目录和首页，暂时由维护者统一处理。想加新页面，先在群里说一声。
:::

## 准备：接受仓库邀请（只需要一次）

1. 注册并登录**自己的** GitHub 账号，不要多人共用一个账号。
2. 打开维护者发来的邀请邮件，或到 GitHub 通知中心查看邀请：<https://github.com/notifications>。
3. 点击 **Accept invitation** 接受邀请。
4. 打开仓库，确认能看到代码：<https://github.com/yuxiongtao666/a2-learning-docs>。

维护者侧的邀请和权限操作见[发布与部署](/deployment)。

## 修改已有页面（推荐流程）

以修改「ROS2 Humble 环境配置」为例。

### 1. 进入编辑页

在已发布的文档页面底部点击「在 GitHub 上编辑此页」；也可以打开仓库，进入 `docs` 对应栏目，找到 `.md` 文件后点击右上角铅笔图标。

### 2. 编辑并预览

用 Markdown 修改内容。点击 **Preview** 标签查看排版效果，确认标题、表格和链接显示正常。只修改本次要改的内容，不要顺手大改格式。

### 3. 提交到新分支

点击 **Commit changes**：

- 提交说明写清楚改了什么，例如 `docs: 补充 ROS2 安装步骤`；
- 选择 **Create a new branch for this commit and start a pull request**；
- 分支名使用 `docs/<你的名字>-<主题>`，例如 `docs/zhangsan-ros2`；
- 点击 **Propose changes**。

不要直接提交到 `main`。`main` 开启分支保护后，网页会要求先创建分支；如果仍然看到「Commit directly to main」，先联系维护者确认分支保护是否生效。

### 4. 创建 Pull Request

1. 标题与提交说明一致，例如 `docs: 补充 ROS2 安装步骤`；
2. 描述按模板填写：修改了什么、为什么改、是否经过实际验证；
3. 点击 **Create pull request**。

### 5. 等待自动检查

PR 页面底部会出现检查项 **Check documentation / check**：

| 结果 | 含义 | 怎么做 |
| --- | --- | --- |
| 绿色 ✓ | 内容检查和构建通过 | 等待维护者审核 |
| 黄色 ● | 还在运行 | 等 1–2 分钟 |
| 红色 ✗ | 检查失败 | 点击 **Details** 查看日志，修复后继续提交 |

常见失败原因：

- 缺少页面开头的 frontmatter；
- 站内链接指向不存在的页面（例如写成 `/setup/ros2`，但实际文件是 `/setup/ros2-humble`）；
- Markdown 或 Vue 语法错误；
- 构建失败。

修复方法：回到自己的分支继续编辑并提交，PR 会自动更新。看不懂日志就把报错截图发到群里。

### 6. 等待维护者审核

- 维护者会在 **Files changed** 里逐行查看修改，确认后点 **Approve** 并合并；
- 收到修改意见时，在同一个分支继续修改并提交，PR 会自动更新；
- 合并后，GitHub Actions 会自动部署，1–2 分钟后刷新线上页面即可看到更新。

## 维护者：审核与合并

1. 收到 PR 后，先确认自动检查是否通过；
2. 打开 **Files changed** 逐行查看修改，对照审核清单；
3. 检查无问题后点击 **Approve**；
4. 选择 **Squash and merge** → **Confirm merge**；
5. 打开仓库 **Actions**，等 `Deploy documentation` 变绿；
6. 刷新线上页面，确认修改已生效；
7. 在[更新日志](/updates/changelog)记录本次变更。

完整审核清单、邀请成员和分支保护配置见[发布与部署](/deployment)。

## 写作约定

### frontmatter

每个页面开头必须保留 frontmatter：

~~~yaml
---
title: "页面标题"
description: "一句话说明本页内容"
author: 维护人或小组名
status: draft
date: 2026-10-17
---
~~~

| 字段 | 说明 |
| --- | --- |
| `title` | 页面标题，同时用于浏览器标题和搜索 |
| `description` | 一句话说明，用于搜索和分享摘要 |
| `author` | 维护人，可以是个人或「文档共建小组」 |
| `status` | `draft` 待完善 / `review` 待复核 / `verified` 已验证 |
| `date` | 最近一次实质更新的日期 |

### 内容

- 注明实际使用的设备型号、软件和 SDK 版本；
- 尚未实机验证的内容保持 `status: draft`，不要标成 `verified`；
- 站内链接写成 `/setup/ros2-humble` 这种路径，不要写完整网址；
- 图片放在 `docs/public/images/`，正文用 `/images/文件名.png` 引用；
- 一次 PR 只改一个主题，方便审核和回滚。

### 安全红线

公开仓库和公开网站上的内容任何人都能看到。**不要写入**：

- 密码、SSH 私钥、Token、Cookie；
- 内网 IP、远控地址、端口映射、VPN / WiFi 配置；
- 设备序列号、未公开的固件和内部链接；
- 个人手机号、学号等隐私信息。

需要写连接方式时使用占位符，例如 `<ROBOT_IP>`、`<SSH_USER>`。截图和日志上传前先打码。更多说明见[发布与部署](/deployment)。

## 常见问题

| 问题 | 原因 | 解决 |
| --- | --- | --- |
| 页面底部没有「在 GitHub 上编辑此页」 | 本地构建不会生成该链接，线上才有 | 从线上站点进入，或直接在仓库里找文件 |
| 看不到仓库 / 没有编辑权限 | 邀请还没接受 | 打开 GitHub 通知，接受邀请 |
| 提交时只能选 `main` | 分支保护未生效或权限不足 | 不要提交，先联系维护者 |
| PR 检查失败 | 内容检查或构建不通过 | 点 Details 看日志，修复后继续提交 |
| PR 提示有冲突 | 修改的页面在 `main` 上也被改过 | 联系维护者，或按 GitHub 提示解决 |
| 合并后网站没更新 | 部署还在进行或失败 | 看 Actions 结果，等 1–2 分钟后强制刷新 |
| 想新增页面 | 需要注册到 `catalog.json` | 先在群里说明，由维护者统一添加 |
| 自己的 PR 无法点 Approve | GitHub 不允许自己批准自己的 PR | 正常现象，等维护者批准即可 |
| PR 页面显示「This branch has not been deployed」 | PR 阶段只跑检查、不部署 | 正常现象，合并后才会部署 |

::: warning 提交前一定要自查
PR 里出现测试内容（比如随手敲的一串数字、`test`、`1111`）会被直接合并进公开文档。
提交前请把 PR 的 **Files changed** 自己看一遍，确认没有遗留的测试文本和临时改动。
:::

## 进阶：本地编写（可选）

需要批量修改或本地预览时，再安装 Git 和 Node.js 22：

~~~bash
git clone https://github.com/yuxiongtao666/a2-learning-docs.git
cd a2-learning-docs
npm ci
npm run docs:dev
~~~

修改后自检、提交并创建 PR：

~~~bash
npm run check
git switch -c docs/my-topic
git add docs
git commit -m "docs: 补充实验记录"
git push -u origin docs/my-topic
~~~

本地构建不会显示「在 GitHub 上编辑此页」，这是正常现象。

## 参考资料

- [GitHub：邀请协作者加入个人仓库](https://docs.github.com/zh/repositories/managing-your-repositorys-settings-and-features/repository-access-and-collaboration/inviting-collaborators-to-a-personal-repository)
- [GitHub：在网页上编辑文件](https://docs.github.com/zh/repositories/working-with-files/managing-files/editing-files)
- [GitHub：合并 Pull Request](https://docs.github.com/zh/pull-requests/collaborating-with-pull-requests/incorporating-changes-from-a-pull-request/merging-a-pull-request)
- [GitHub：管理分支保护规则](https://docs.github.com/zh/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/managing-a-branch-protection-rule)
