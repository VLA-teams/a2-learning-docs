# A2 学习与开发文档中心

独立项目：F:\Deepseek\project_6\a2-learning-docs。

参考文档站的顶部导航、左侧章节、正文与右侧页内目录。六栏目按参考图片组织，首页和侧栏共用目录配置。

## 本地启动

安装 Node.js 22，在 PowerShell 执行：

~~~powershell
cd F:\Deepseek\project_6\a2-learning-docs
npm ci
npm run docs:dev
~~~

打开终端显示的本地地址，默认 http://127.0.0.1:5173/。也可以双击「启动网站.cmd」。

~~~powershell
npm run check
npm run docs:preview
~~~

## 内容与主题

- 内容：docs/platform、setup、simulation、vla、handbook、updates。
- 目录与首页入口：docs/.vitepress/theme/catalog.json。
- 样式：docs/.vitepress/theme/custom.css 与 components/。
- 模板：templates/page.md。
- 协作：docs/contribute.md；部署：docs/deployment.md。

## GitHub Pages

新建仓库，提交到 main；Settings → Pages → Source 选择 GitHub Actions。工作流自动获取真实仓库与路径。PR 检查通过并合并后自动部署。

建议使用小组 Organization，组员 Write 权限；保护 main，要求 PR、至少一人批准及 check 检查通过。

## 内容状态

技术页为待填写的学习与验证结构，尚未录入真实实机结果。用 draft / review / verified 区分状态。
