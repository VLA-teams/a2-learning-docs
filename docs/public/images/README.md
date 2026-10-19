# 图片目录

这个目录存放截图、架构图、界面示意等图片，构建时会**原样复制到网站根目录**，
所以文件 `a2-joint-panel.png` 对应的访问地址是 `/images/a2-joint-panel.png`。

## 引用方式

在 Markdown 页面里写：

~~~markdown
![示教面板启动后的界面](/images/a2-joint-panel.png)

图 1：出现 `PANEL READY` 表示服务已恢复。
~~~

**注意开头的 `!`**：漏掉它会显示成一行文字链接，而不是图片。

## 上传规则

| 项目 | 要求 |
| --- | --- |
| 文件名 | 用英文或拼音，不要中文、空格、`#`、`?` |
| 单个文件 | 建议不超过 2 MB，超过先压缩 |
| 格式 | 截图用 `.png`，照片或大幅用例图用 `.webp` |
| 内容 | 截图必须先打码，见下方提醒 |
| 引用路径 | 以 `/` 开头，写成 `/images/文件名.png` |

## 命名建议

- ✅ `a2-joint-panel.png`、`ros2-error-1.png`、`arm-workspace.webp`
- ❌ `截图2026-10-19.png`（中文会被编码成 `%E6%88%AA%E5%9B%BE`）
- ❌ `ROS2 报错.png`（空格在网址里要写成 `%20`）

## 怎么上传

完整步骤见[如何更新文档](/contribute#插入图片)，简版：

1. 进入本目录，点 **Add file → Upload files**；
2. 拖入图片，提交时选择 **Create a new branch and start a pull request**；
3. 等自动检查通过、维护者批准合并，网站自动发布。

## 打码提醒

终端截图最常见的泄露点是 `hostname`、`whoami` 输出的用户名、IP 地址、
Docker 容器 ID、设备序列号。上传前用截图工具涂掉，或裁掉那一行。
