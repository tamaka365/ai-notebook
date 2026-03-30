## 项目概述

Next.js + shadcn/ui + Plate.js 的 Markdown 笔记本应用。

**技术栈**: Next.js latest / React / TypeScript / Tailwind CSS / shadcn/ui / Plate.js / bcryptjs / jose / nodemailer / zod

**API 分层**: OpenAPI 接口 (`/api/*`) + Server Actions (`app/actions/*`) + 内部工具 (`lib/*`)

**核心模块**: 认证系统 / 用户管理 / 文件系统 / Markdown 编辑器 / 文件浏览器 / OpenAPI 文档

**权限层级**: 页面 Layout → Middleware → Server Action → 文件操作

**开发计划**: [.claude/plans/README.md](./plans/README.md) — 汇总所有开发步骤的计划概览

## 规则要求

- 使用中文交流
- 本项目使用的语言是中文，所有组件的文本内容都要用中文，一些固用内容和缩写除外，例如：API、SDK、Vercel 等
- nodejs 包管理器必须使用 pnpm
- 在修改任何组件样式之前，先考虑能否通过设置 props 来达到预期，不行的话再考虑修改样式
- 非必要尽量不要运行 `pnpm dev` 等长时间运行的任务
- 需要验证修改时，根据修改内容 使用 eslint 或 tsc 验证修改
- 如果验证时发现错误，修复好之后再次验证，直到没有错误为止
- 执行 plan 以及修复执行后的错误时，不要修改任何 plan 中未包含的文件
- 更新已经创建的 plan 时，记得从 plan 中删除已经执行过的步骤
- typescript 禁止使用 any 类型