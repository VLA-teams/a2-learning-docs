# 附件目录

这个目录存放 PDF、数据表、检查清单等附件，构建时会**原样复制到网站根目录**，
所以文件 `a2-dev-guide.pdf` 对应的访问地址是 `/files/a2-dev-guide.pdf`。

## 上传规则

| 项目 | 要求 |
| --- | --- |
| 文件名 | 用英文或拼音，不要中文、空格、`#`、`?` |
| 单个文件 | 建议不超过 25 MB（GitHub 网页上传上限） |
| 内容 | 必须可公开，不含密码、内网 IP、设备序列号等 |
| 引用方式 | 在 Markdown 里写 `[说明](/files/文件名.pdf)` |

## 命名建议

- ✅ `a2-dev-guide.pdf`、`a2-manual-v2.1.pdf`、`checklist-arm.pdf`
- ❌ `A2开发手册.pdf`（中文会被编码成 `%E4%B8%AD%E6%96%87`）
- ❌ `手册 v2 (最终版).pdf`（空格和括号会破坏链接）

## 怎么上传

完整步骤见[如何更新文档](/contribute#上传-pdf-和附件)，简版：

1. 进入本目录，点 **Add file → Upload files**；
2. 拖入 PDF，提交时选择 **Create a new branch and start a pull request**；
3. 等自动检查通过、维护者批准合并，网站自动发布。

超过 25 MB 的文件网页上传会失败，需要用 Git 命令行推送，或联系维护者。
超过 100 MB 请不要放进仓库，改用外部网盘，文档里只放链接。
