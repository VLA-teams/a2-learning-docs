---
title: "发布与部署"
description: "网站发布、邀请成员、保护 main、审核合并与回滚的维护者操作说明。"
author: 文档共建小组
status: review
date: 2026-10-17
---

# 发布与部署

本页面向维护者，包含两部分：网站如何发布，以及如何邀请组员、保护 `main` 并审核合并 PR。组员的操作说明见[如何更新文档](/contribute)。

## 一、网站发布方式

- 推送到 `main` 后，`Deploy documentation` 工作流自动构建并发布到 GitHub Pages，无需手动上传网站文件。
- PR 阶段由 `Check documentation` 工作流做内容检查和构建，状态检查名称为 **`check`**。
- 当前线上地址：<https://yuxiongtao666.github.io/a2-learning-docs/>

首次上线：

1. GitHub 新建公开仓库，例如 `a2-learning-docs`；GitHub Free 的 Pages 方案使用公开仓库。
2. 提交本项目到 `main` 分支。
3. Settings → Pages → Build and deployment → Source 选择 **GitHub Actions**。
4. 在 Actions 运行 `Deploy documentation`，或推送一次提交。
5. 完成后从 Pages 设置或部署结果打开真实网址。

地址与路径：构建读取 `configure-pages` 返回的路径，个人主页、项目页与自定义域名的前缀由 Pages 设置决定；仓库地址由 `GITHUB_REPOSITORY` 自动注入，无需手动替换用户名。

本地测试项目页前缀时，在 PowerShell 执行：

~~~powershell
$env:DOCS_BASE = '/a2-learning-docs/'
npm run docs:build
npm run docs:preview
~~~

公开 Pages 的阅读者无需登录。若要求仅小组可见，需要另选具有访问控制的托管方式。

## 二、邀请组员（一次性）

组员使用自己的 GitHub 账号，不需要安装 Git 或 Node.js。

1. 打开仓库 **Settings → Collaborators**。
2. 点击 **Add people**，输入组员的 GitHub 用户名。
3. 角色选择 **Write**（可以在仓库中创建分支、提交 PR）。
4. 点击 **Add … to this repository** 发送邀请。
5. 组员在邮件或 GitHub 通知里点击 **Accept invitation**。

注意：

- 仓库是公开仓库，只邀请可信成员；
- 每人使用自己的账号，不要共用；
- 先邀请 1 名组员做试点，流程跑通后再批量邀请。

## 三、保护 main（一次性，建议在邀请前完成）

1. 打开 **Settings → Branches**。
2. 点击 **Add classic branch protection rule**（如果界面已切换到 Rulesets，用同等规则配置）。
3. 按下表填写：

| 设置项 | 配置 | 说明 |
| --- | --- | --- |
| Branch name pattern | `main` | 只保护主分支 |
| Require a pull request before merging | 勾选 | 所有修改必须经过 PR |
| Require approvals | 勾选，设为 **1** 人 | 至少一位成员批准 |
| Require status checks to pass before merging | 先不勾，试点 PR 之后再勾 | 选择 `check` |
| Require branches to be up to date before merging | 建议与上一条一起勾选 | 合并前需要同步 `main` |
| Do not allow bypassing the above settings | 建议先不勾 | 否则自己的 PR 也需要他人批准；有第二位维护者后再打开 |
| Allow force pushes / Allow deletions | 不勾 | 禁止强推和删除分支 |

**为什么分两步**：`check` 状态检查需要先运行过一次（例如试点 PR）才会出现在可勾选列表里。第一次保存规则时先勾「PR + 1 人批准」，试点 PR 跑出 `check` 后再回来补勾状态检查。

如果仍然搜不到 `check`：让试点 PR 重新运行一次检查，或在 Actions 里手动运行一次 `Check documentation`，然后刷新分支保护设置页面。

## 四、试点验收（先邀请 1 人）

1. 邀请 1 名组员，确认对方已接受邀请。
2. 请对方在网页上只修改一句话，创建一个分支并提交 PR。
3. 打开 PR 页面，确认 **Check documentation / check** 出现并通过。
4. 回到分支保护规则，勾选 **Require status checks** 并选择 `check`。
5. 在 PR 上点击 **Approve** → **Squash and merge** → **Confirm merge**。
6. 打开仓库 **Actions**，等 `Deploy documentation` 变绿。
7. 刷新线上页面，确认修改已生效。
8. 记录试点结果，再批量邀请其余组员。

::: info 当前状态
邀请组员、保护 `main`、试点 PR 目前**尚未执行**，等新版本上传 GitHub 后按本节顺序完成。
:::

## 五、日常审核与合并

1. PR 出现在仓库 Pull requests 页面，也可以在群里提醒维护者；
2. 先确认自动检查通过；
3. 打开 **Files changed** 逐行查看修改，对照下面的审核清单；
4. 确认后点击 **Approve**；
5. 选择 **Squash and merge** → **Confirm merge**；
6. 等 Actions 部署完成，刷新线上页面确认；
7. 在[更新日志](/updates/changelog)记录本次变更。

### 审核清单

- [ ] 修改内容与 PR 描述一致，没有无关改动
- [ ] 设备型号、软件版本已注明
- [ ] 未验证内容标为 `draft`
- [ ] 站内链接可点击、图片路径正确
- [ ] 没有密码、密钥、内网 IP、远控地址、序列号和未打码截图
- [ ] 自动检查通过

## 六、合并策略与分支清理

- 统一使用 **Squash and merge**，每个 PR 只留一个干净提交；
- 建议在 **Settings → General → Pull requests** 打开 **Automatically delete head branches**；
- 有冲突时让作者在网页上重新编辑，或由维护者在本地解决，不要用强推覆盖别人的修改。

## 七、回滚

1. 找到出问题的 PR 或提交；
2. 在 PR 页面点击 **Revert**，按提示创建回滚 PR；
3. 审核合并后自动重新部署；
4. 在更新日志记录回滚原因。

## 八、常见问题

| 现象 | 检查 |
| --- | --- |
| 分支保护里搜不到 `check` | 先让试点 PR 运行一次检查；或手动运行 Check documentation 后刷新 |
| 自己的 PR 无法批准 | GitHub 不允许自己批准自己的 PR；临时允许管理员绕过，或请另一位成员批准 |
| 组员接受邀请后仍看不到仓库 | 确认邀请是否已接受、登录的账号是否正确 |
| 合并后网站没更新 | 看 Actions 是否成功；Pages 部署需要 1–2 分钟；强制刷新浏览器 |
| 部署失败 | 看 Actions 报错；常见为构建失败、Pages 配置或组织策略问题 |
| 组员没有写权限 | Settings → Collaborators 确认角色为 Write 且已接受邀请 |

## 九、安全提醒

- 公开仓库和公开网站上的所有内容任何人都能看到，提交历史同样公开；
- 不要让文档出现密码、SSH 私钥、Token、内网 IP、远控地址、设备序列号；
- 需要写连接方式时使用占位符，例如 `<ROBOT_IP>`、`<SSH_USER>`；
- 截图、日志、终端窗口上传前打码；
- 如果后续需要更强的自动拦截，可以把敏感信息检查脚本加入 `npm run check`（待定）。

## 十、后续可选项

- 增加 `CODEOWNERS`，按栏目自动分配审阅人；
- 为 PR 增加预览部署，审核时直接看构建后的页面；
- 增加敏感信息自动检查，在 PR 阶段拦截凭据和内部地址；
- 转为 GitHub Organization 管理，适合成员和仓库更多的情况。
