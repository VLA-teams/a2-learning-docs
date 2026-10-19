---
title: "如何更新文档"
description: "用 GitHub 网页修改文档、提交 PR 并完成审核发布，不需要安装 Git 或 Node.js。"
author: 文档共建小组
status: review
date: 2026-10-19
---

# 如何更新文档

推荐所有组员使用 **GitHub 网页** 修改文档，不需要安装 Git、Node.js 或任何编辑软件。只要有自己的 GitHub 账号，在浏览器里就能完成。

整个流程：
~~~text
接受仓库邀请 → 网页编辑 Markdown → 提交到自己的分支并创建 PR
→ 自动检查 → 维护者审核合并 → 网站自动发布
~~~

::: tip 新增页面现在是自动的
把 `.md` 文件放进六个栏目目录之一（`platform` / `setup` / `simulation` / `vla` / `handbook` / `updates`），
写好 frontmatter，**不需要再改 `catalog.json`**，侧栏和首页会自动出现这一页。

想控制它在侧栏里的位置，在 frontmatter 里加 `order: 3`（数字越小越靠前）；
不写 `order` 的页面排在该栏目最后。
:::

## 新建页面（GitHub 网页）

1. 在仓库中进入 `docs` 下对应的栏目目录，例如 `docs/setup/`。
2. 点击 **Add file → Create new file**，文件名填写 `ros2-faq.md` 这样的英文名称。
3. 复制仓库中 `templates/page.md` 的内容，填写标题、摘要、维护人、状态、日期，再编写正文。第一行必须是 `---`。
4. 提交到自己的分支并创建 PR，等待自动检查通过，再由维护者审核合并。
5. 等 `Deploy documentation` 部署成功，刷新网站；新页面会自动出现在对应栏目的左侧目录和首页入口中。

可以在栏目内使用子目录，例如 `docs/setup/ros2/faq.md`，仍自动列在「环境配置」栏目下。栏目根目录的 `index.md` 是概览页，不重复列入目录；子目录的 `index.md` 会收录。

`catalog.json` 是构建时按现存页面全量生成的临时文件，已加入 `.gitignore`，GitHub 仓库不保存它。**新增、改名或删除页面时都不需要编辑或提交它**。修改 frontmatter 中的 `title` 会同步更新目录标题；`order` 用于排序。自动目录目前覆盖上述六个栏目，新建第七个顶层栏目需要维护者调整栏目定义。

## 删除页面或附件（GitHub 网页）

### 删除前确认

- **确认删除对象**：删除 `docs/` 对应栏目下的 `.md` 才会移除网页；删除 `docs/public/files/` 下的 PDF 只会移除附件，引用它的网页仍然存在。
- **检查其他页面的引用**：搜索待删除页面的文件名或站内路径，找到其他 Markdown 正文中指向它的链接。附件也要搜索其文件名，避免留下无法下载的链接。
- **保留栏目概览页**：六个栏目根目录的 `index.md` 用于展示栏目文档，不要作为普通文章随意删除；确需调整栏目结构时先联系维护者。

### 删除与提交

1. 在 GitHub 仓库中打开要删除的文件，使用文件操作菜单中的删除功能。
2. 将删除提交到自己的分支，在**同一个分支、同一个 PR** 中完成引用清理，并说明删除原因。
3. 等待 **Check documentation / check** 通过，再由维护者审核合并。
4. 合并后等待 **Deploy documentation** 成功，刷新网站，确认页面入口或附件已移除。

**无需编辑或提交 `catalog.json`**。构建会按现存页面重新生成目录，自动同步侧栏、首页和栏目概览页。栏目概览页中的 `<ModulePages />` 也会自动更新，无需逐条删链接。

### 正文里的引用在哪里清理？

在**仍然存在、且引用了被删内容的其他 `.md` 文件里**清理，不是在已删除的文件中操作。删除那条引用，或改成仍然有效的目标；如果所在句子或段落依赖该资料，也一起调整表述。

例如，删除 `docs/setup/ros2-faq.md` 后，如果另一篇文章中写有下面这条链接，就需要修改那篇文章：

~~~markdown
[ROS2 常见问题](/setup/ros2-faq)
~~~

删除 PDF 也是同样的处理方式。自动目录不会改写正文中的交叉引用；如果自动检查提示「站内链接指向不存在的页面」，日志会列出**引用所在文件**和**失效路径**，按日志定位修改，再提交到原 PR 分支即可。

::: warning 删除后网站仍显示旧内容怎么办？
先查看仓库 Actions 中最新的部署结果。内容检查或部署失败时，线上仍显示上一次成功发布的内容；应先修复日志里的问题，等新部署成功后再刷新，不需要手动删除目录文件。
:::

### 误删怎么办？

尚未合并时，在原 PR 分支恢复文件；已经合并时，可从 Git 历史恢复，或请维护者协助。恢复后重新检查并部署。如果同时删除或修改了其他页面中的引用，也要一并恢复或核对。

## 准备：接受仓库邀请（只需要一次）

1. 注册并登录**自己的** GitHub 账号，不要多人共用一个账号。
2. 打开维护者发来的邀请邮件，或到 GitHub 通知中心查看邀请：<https://github.com/notifications>。
3. 点击 **Accept invitation** 接受邀请。
4. 打开仓库，确认能看到代码：<https://github.com/VLA-teams/a2-learning-docs>。

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

### frontmatter（新建页面最容易踩的坑）

::: danger 新建页面时，第一行必须是 ---
只要文件开头不是 `---`，自动检查就会直接失败，PR 无法合并。这是目前组员最常遇到的问题。

**最容易犯的错**：直接在网页上点「Create new file」，敲了 `# 标题` 就开始写正文。
正确做法是先把这个模板整段粘进去，再改内容：

~~~yaml
---
title: "页面标题"
description: "一句话说明本页内容"
author: 你的名字
status: draft
date: 2026-10-17
---

# 页面标题

正文从这里开始写。
~~~

**注意**：`---` 必须是**文件的第一行**，前面不能有空行、说明文字或空格。
:::

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
| `status` | `draft` 待完善 / `review` 待复核 / `verified` 已验证（只能填这三个值） |
| `date` | 最近一次实质更新的日期，格式 `2026-10-17` |

首页 `docs/index.md` 是例外，只需要 `title` 和 `description`。

### 可选字段：order（控制侧栏顺序）

不写 `order` 的页面排在所属栏目中所有带 `order` 的页面之后，再按相对文件路径排序。想调整位置，加一个 `order`：

~~~yaml
---
title: "ROS2 常见问题"
description: "汇总 ROS2 环境里的高频报错。"
author: 张三
status: draft
date: 2026-10-19
order: 2
---
~~~

`order` 数字越小越靠前，同栏目内按它升序排列；不写 `order` 的页面排在所有带 `order` 的页面之后。
不确定用几号就留空，之后让维护者统一调整。

### 新建页面的文件名

文件名用**英文短横线**，不要用中文或空格：

| 推荐 | 不推荐 | 原因 |
| --- | --- | --- |
| `a2-5090-recovery.md` | `AGIBOT_A2_5090_重启恢复手册.md` | 中文会被编码成 `%E4%B8%AD%E6%96%87` |
| `ros2-humble.md` | `ROS2 Humble.md` | 空格在网址里要写成 `%20` |

`catalog.json`（侧栏与首页的目录）会在构建时**自动生成**，不需要手工改。
你只要把文件放进正确的栏目目录，它就会自动出现在侧栏和首页。
对应栏目的 `index.md` 使用 `<ModulePages />` 自动列出本栏目页面，同样无需补链接。

### 内容

- 注明实际使用的设备型号、软件和 SDK 版本；
- 尚未实机验证的内容保持 `status: draft`，不要标成 `verified`；
- 站内链接写成 `/setup/ros2-humble` 这种路径，不要写完整网址；
- 图片放在 `docs/public/images/`，正文用 `/images/文件名.png` 引用；
- PDF、数据集等附件放在 `docs/public/files/`，正文用 `/files/文件名.pdf` 引用；
- 一次 PR 只改一个主题，方便审核和回滚。

## 上传 PDF 和附件

PDF 手册、数据表、检查清单这类文件，**全部组员都可以上传**，同样走 GitHub 网页，不需要安装任何工具。

### 规则

| 项目 | 要求 |
| --- | --- |
| 存放位置 | `docs/public/files/` |
| 引用路径 | `/files/文件名.pdf`（以 `/` 开头） |
| 文件名 | **用英文或拼音**，不要中文、空格、`#`、`?` |
| 单个文件大小 | 建议 **不超过 25 MB**（GitHub 网页上传上限） |
| 内容 | 必须是可公开的资料，见下方安全提醒 |

### 操作步骤

**1. 确认目录存在**

在仓库网页依次点开 `docs` → `public` → `files`。
如果 `files` 不存在，点 **Add file → Create new file**，文件名填 `files/README.md`，
内容写一行说明，提交后目录就建好了（或直接告诉维护者，由维护者创建）。

**2. 上传 PDF**

1. 进入 `docs/public/files/` 目录；
2. 点右上角 **Add file** → **Upload files**；
3. 把 PDF 拖进虚线框，或点 **choose your files** 选择；
4. 在下方 **Commit changes** 里：
   - 提交说明写 `docs: 上传 A2 开发手册 PDF`；
   - 选择 **Create a new branch for this commit and start a pull request**；
   - 分支名 `docs/<你的名字>-pdf`，例如 `docs/zhangsan-pdf`；
5. 点 **Propose changes**，然后按[修改已有页面](#修改已有页面推荐流程)的第 4–6 步创建 PR、等检查、等审核。

**3. 在页面里引用**

在对应的 `.md` 页面里加一行链接：

~~~markdown
- [A2 v2.1 开发手册（PDF，8.2 MB）](/files/a2-dev-guide.pdf)
~~~

保存后按同样的 PR 流程提交。**注意：上传 PDF 和修改页面可以是同一个 PR，也可以分两个 PR。**

### 为什么文件名要用英文

中文文件名在网址里会被编码成一长串 `%E4%B8%AD%E6%96%87`，
分享出去的链接很难看，部分浏览器和聊天工具还会把它截断。
例如 `A2开发手册.pdf` 会变成：

~~~text
/files/A2%E5%BC%80%E5%8F%91%E6%89%8B%E5%86%8C.pdf
~~~

推荐写法：`a2-dev-guide.pdf`、`a2-manual-v2.1.pdf`、`checklist-arm.pdf`。

### 文件太大怎么办

GitHub 网页上传**单个文件上限 25 MB**。超过这个大小，网页上传会直接失败。

| 文件大小 | 做法 |
| --- | --- |
| ≤ 25 MB | 网页直接上传（推荐，最简单） |
| 25–100 MB | 需要用 Git 命令行推送，或请维护者代传 |
| > 100 MB | **不要放仓库**，改用外部网盘 / 对象存储，文档里只放链接 |

超过 25 MB 但确实要放进仓库时，只能走本地 Git（需要安装 Git）：

~~~bash
git clone https://github.com/VLA-teams/a2-learning-docs.git
cd a2-learning-docs
# 把 PDF 复制到 docs/public/files/ 目录下
git switch -c docs/zhangsan-pdf
git add docs/public/files/你的文件.pdf
git commit -m "docs: 上传 XXX PDF"
git push -u origin docs/zhangsan-pdf
~~~

然后在 GitHub 网页上从 `docs/zhangsan-pdf` 分支创建 PR。

::: warning PDF 同样是公开的
`docs/public/` 下的文件会被原样发布到公开网站，**任何人都能直接下载**。
上传前确认 PDF 里没有密码、内网 IP、设备序列号、未公开的内部资料。
厂商手册请确认可以公开转载；不确定就先问维护者。
:::

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
| 报错「缺少 frontmatter」 | 新建的 md 文件第一行不是 `---` | 在文件**第一行**插入 frontmatter 模板，见上文「frontmatter」 |
| PR 提示有冲突 | 修改的页面在 `main` 上也被改过 | 联系维护者，或按 GitHub 提示解决 |
| 合并后网站没更新 | 部署还在进行或失败 | 看 Actions 结果，等 1–2 分钟后强制刷新 |
| 想新增页面 | 目录由构建自动生成 | 在六个栏目目录之一新建 `.md`，填写 frontmatter，提交 PR，无需修改 `catalog.json` |
| 上传 PDF 时提示文件太大 | 网页上传单文件上限 25 MB | 压缩 PDF，或改用 Git 命令行，或联系维护者代传 |
| PDF 上传后链接打不开（404） | 文件不在 `docs/public/files/` 下 | 确认路径是 `docs/public/files/文件名.pdf` |
| PDF 链接被检查判为死链 | 文件名写错，或文件还没提交 | 核对 `/files/` 后面的文件名，注意大小写 |
| PDF 链接里出现 `%E4%B8%AD` | 文件名用了中文 | 改成英文或拼音文件名 |
| 自己的 PR 无法点 Approve | GitHub 不允许自己批准自己的 PR | 正常现象，等维护者批准即可 |
| PR 页面显示「This branch has not been deployed」 | PR 阶段只跑检查、不部署 | 正常现象，合并后才会部署 |

::: warning 提交前一定要自查
PR 里出现测试内容（比如随手敲的一串数字、`test`、`1111`）会被直接合并进公开文档。
提交前请把 PR 的 **Files changed** 自己看一遍，确认没有遗留的测试文本和临时改动。
:::

## 进阶：本地编写（可选）

需要批量修改或本地预览时，再安装 Git 和 Node.js 22：

~~~bash
git clone https://github.com/VLA-teams/a2-learning-docs.git
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
