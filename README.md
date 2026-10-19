# A2 学习与开发文档中心

机器人开发与学习知识库——A2 学习与开发文档站，按「机器人平台 / 环境配置 / 仿真与运动控制 / VLA 模型部署 / 实验操作手册 / 版本与更新」六个栏目组织，把配置、验证和解决问题的过程沉淀下来。

- 线上文档：<https://VLA-teams.github.io/a2-learning-docs/>
- 代码仓库：<https://github.com/VLA-teams/a2-learning-docs>

## 协作方式（推荐：GitHub 网页）

组员**不需要安装 Git 或 Node.js**，只要有自己的 GitHub 账号，全部在浏览器里完成：

~~~text
维护者邀请成员 → 成员网页修改 Markdown、提交 PR
→ 自动检查 → 维护者审核合并 → 网站自动更新
~~~

- 组员：阅读 [docs/contribute.md](docs/contribute.md)，按步骤接受邀请、编辑页面、提交 PR。
- 维护者：邀请成员、保护 `main`、审核合并，见 [docs/deployment.md](docs/deployment.md)。
- 新增页面：在六个栏目目录之一新建 `.md`，按 `templates/page.md` 填好 frontmatter，提交 PR 即可；目录在构建时自动生成，无需手工注册。

**当前状态**：邀请组员、保护 `main`、试点 PR 均已完成（2026-10-19）。首位组员 `zzy1239` 通过 PR #1 跑通了「网页编辑 → 提交分支 → 自动检查 → 审核合并 → 自动部署」全流程，可以批量邀请其余成员。详见 [docs/deployment.md](docs/deployment.md) 第四节。

## 项目结构

~~~text
.
├─ docs/                          # 站点内容（Markdown 源码）
│  ├─ .vitepress/
│  │  ├─ config.mts               # 站点配置：标题、导航、侧栏、搜索
│  │  └─ theme/                   # 自定义主题、目录配置与样式
│  │     ├─ catalog.json          # 自动生成的六栏目目录（侧栏与首页共用）
│  │     └─ components/           # LabHome / LabHeader / PageMeta
│  ├─ platform/ setup/ simulation/ vla/ handbook/ updates/   # 六栏目
│  ├─ guide/                      # 快速开始
│  ├─ index.md                    # 首页
│  ├─ contribute.md               # 如何更新文档（组员）
│  └─ deployment.md               # 发布与部署（维护者）
├─ scripts/build-catalog.mjs      # 扫描六栏目 Markdown，自动生成目录
├─ scripts/check-content.mjs      # frontmatter 与站内链接检查
├─ templates/page.md              # 新建页面模板
└─ .github/workflows/             # PR 检查 + 自动部署
~~~

## 内容与主题

- 内容目录：`docs/platform`、`setup`、`simulation`、`vla`、`handbook`、`updates`。
- 目录与首页入口：`scripts/build-catalog.mjs` 递归扫描六个栏目（含子目录），从 frontmatter 读取 `title`、`description`、可选的 `order`，生成 `docs/.vitepress/theme/catalog.json`；左侧栏和首页卡片共用，生成文件无需手工编辑。
- 排序：`order` 数字越小越靠前；未填写时排在带 `order` 的页面后面，再按相对文件路径排序。栏目根目录的 `index.md` 不重复列出，子目录的 `index.md` 正常收录。新增顶层栏目需由维护者修改脚本中的 `GROUPS`。
- 样式：`docs/.vitepress/theme/custom.css` 与 `components/`。
- 页面模板：`templates/page.md`。

## 本地开发（可选）

安装 Node.js 22，在项目目录执行：

~~~powershell
npm ci
npm run docs:dev      # 本地预览，默认 http://127.0.0.1:5173/
npm run check         # 内容检查 + 构建
npm run docs:preview  # 预览构建结果
~~~

上述开发启动、检查和构建命令均会先生成目录。开发服务运行期间新增、删除、改名页面或调整 frontmatter 后，另开终端运行 `npm run catalog` 更新目录，或重启开发服务。

## CI 与发布

- PR：`.github/workflows/check.yml` 运行内容检查和构建，状态检查名称为 `check`。
- 合并到 `main`：`.github/workflows/deploy.yml` 自动构建并发布 GitHub Pages。
- 两个工作流均运行 `npm run check`，自动完成「扫描页面 → 生成目录 → 内容检查 → VitePress 构建」，无需将生成的 `catalog.json` 另外提交回仓库。
- 组员提交 PR 后等检查通过、维护者批准合并，网站会自动更新，无需手动上传。

## 内容状态

用 frontmatter 的 `status` 区分：`draft` 待完善、`review` 待复核、`verified` 已验证。技术页默认 `draft`，只有经过实机或实际环境验证后才改为 `verified`。

## 安全约定

公开仓库和公开网站上的所有内容任何人都能看到，提交历史同样公开。不要写入密码、SSH 私钥、Token、内网 IP、远控地址、设备序列号和组员隐私；需要写连接方式时使用 `<ROBOT_IP>`、`<SSH_USER>` 这类占位符，截图上传前打码。

## 后续计划

1. 上传新版本到 GitHub，按 `docs/deployment.md` 完成邀请成员、保护 `main`、试点 PR 测试。
2. 页面视觉优化（暂缓，后续单独进行）。
