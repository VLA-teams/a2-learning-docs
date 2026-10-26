---
title: "服务器操作与镜像制作手册"
description: "下载联想服务器作业提交与 CentOS 镜像制作的操作手册。"
author: 文档共建小组
status: review
date: 2026-10-26
order: 4
---

# 服务器操作与镜像制作手册

这两份手册分别介绍联想服务器上的作业提交流程，以及在 VMware 中制作 CentOS、Docker 和 Singularity 镜像的完整步骤。公开版本已替换服务器地址和初始密码，并清理截图中可能包含的账号、内网地址等环境信息。

## 下载手册

| 文档 | 适用场景 | 格式 |
| --- | --- | --- |
| [联想服务器使用步骤](/files/lenovo-server-usage-guide.docx) | 登录 LiCO、上传项目、提交作业、查看结果和删除作业 | DOCX |
| [CentOS 镜像制作手册](/files/centos-image-vmware-docker-manual.docx) | 在 VMware 中安装 CentOS 7，配置 yum 源并制作包含 Docker、Go、Singularity 和 PyTorch 的镜像 | DOCX |

## 使用提示

手册中的 `<SERVER_URL>`、`<INITIAL_PASSWORD>` 和 DNS 地址是环境占位符。实际使用时，请向实验室管理员获取当前服务器地址和账号信息，不要把手册中的示例值当作固定配置。

操作涉及系统安装、容器镜像构建和服务器作业提交。执行前请确认目标机器和资源配额，避免覆盖正在使用的环境或占用他人正在排队使用的 GPU。

## 文件更新

两份 DOCX 位于 [`docs/public/files/`](https://github.com/VLA-teams/a2-learning-docs/tree/main/docs/public/files)。更新时请保留下载链接中的英文文件名，并在提交前清除密码、内网 IP、设备序列号和个人账号等敏感信息。
