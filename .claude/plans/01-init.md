# 步骤 1：初始化项目与配置环境

## 描述

创建 Next.js 项目，安装全部依赖，配置 shadcn/ui、Tailwind CSS、TypeScript 等基础环境。

---

## 前端

### 1.1 创建 Next.js 项目

- [ ] 执行 `npx create-next-app@latest ai-notebook --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --no-git`
  - 注意：在项目根目录下创建 nextjs `ai-notebook` 后，把其中的文件都移动到项目根目录来
- [ ] 选择以下选项（交互式）：
  - TypeScript: **是**
  - ESLint: **是**
  - Tailwind CSS: **是**
  - `src/` directory: **是**
  - App Router: **是**
  - Import alias: `@/*`
  - Turbopack: **否**（可选）
  - Customize default import alias: `@/*`

### 1.2 配置 TypeScript

- [ ] 确认 `tsconfig.json` 中 `strict: true` 已启用
- [ ] 确认 `tsconfig.json` 中 `verbatimModuleSyntax: true` 已启用
- [ ] 确认 `tsconfig.json` 中 `noUncheckedIndexedAccess: true` 已启用（推荐）
- [ ] 确认 `@/*` 路径别名映射到 `./src/`（或根目录视项目结构而定）
- [ ] 安装 `typescript` 确认版本为 5.x

### 1.3 配置 Tailwind CSS

- [ ] 确认 `tailwind.config.ts` 已生成并包含必要配置
- [ ] 在 `globals.css` 中确认 Tailwind 指令（`@tailwind base; @tailwind components; @tailwind utilities;`）
- [ ] 确认 PostCSS 配置（`postcss.config.mjs`）
- [ ] 如需 Tailwind CSS v4，升级配置（v4 使用 `@import "tailwindcss"` 语法）

### 1.4 安装和初始化 shadcn/ui

- [ ] 执行 `npx shadcn@latest init`
  - 选择以下选项：
    - Style: **Default**
    - Base color: **Slate**（或根据喜好选择）
    - CSS file: `src/app/globals.css`（或已有的 CSS 文件）
    - CSS variables: **是**
    - Custom prefix: **否**
    - tailwind.config.js: **是**
    - Components: `@/components/ui`
    - Utils: `@/lib/utils`
    - React Server Components: **是**
- [ ] 安装常用 shadcn/ui 组件：

```bash
npx shadcn@latest add button input dialog select dropdown-menu toast alert avatar popover skeleton tooltip label
```

### 1.5 配置路径别名

- [ ] 确认 `tsconfig.json` 中路径别名：

```json
{
  "compilerOptions": {
    "baseUrl": "/",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### 1.6 创建环境变量示例文件

- [ ] 创建 `.env.example`：

```bash
# JWT 密钥（openssl rand -base64 32 生成）
AUTH_SECRET=your-secret-key-here

# SMTP 邮件配置（用于发送重置密码验证码）
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=noreply@example.com
SMTP_PASS=your-smtp-password
SMTP_FROM=AI Notebook <noreply@example.com>

# 验证码有效期（秒）
CODE_EXPIRY=300

# 笔记根目录（服务端使用）
NOTES_ROOT_PATH=./notes
```

---

## 后端

### 2.1 安装后端依赖

- [ ] 安装核心依赖：

```bash
pnpm add bcryptjs jose nodemailer zod
```

| 包 | 版本 | 用途 |
|----|------|------|
| `bcryptjs` | latest | 密码加密 |
| `jose` | latest | JWT 签名验证（Edge 兼容） |
| `nodemailer` | latest | 邮件发送 |
| `zod` | latest | 数据验证 |

- [ ] 安装类型定义：

```bash
pnpm add -D @types/bcryptjs @types/nodemailer
```

### 2.2 创建配置文件

- [ ] 创建 `config.json`（初始空配置）：

```json
{
  "system": {
    "notesRootPath": "./notes"
  },
  "users": []
}
```

- [ ] 创建/更新 `.gitignore`（确保以下内容）：

```
# 环境变量
.env.local
.env.*.local

# 配置文件（包含用户数据的敏感配置）
config.json

# 笔记文件
notes/

# Next.js
.next/
out/

# 依赖
node_modules/

# 调试
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# IDE
.idea/
.vscode/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Vercel
.vercel
```

### 2.3 创建目录结构

- [ ] 创建以下目录：

```bash
mkdir -p src/app/reset-password
mkdir -p src/app/actions
mkdir -p src/components/auth
mkdir -p src/components/layout
mkdir -p src/lib/auth
mkdir -p src/lib/config
mkdir -p src/lib/fs
mkdir -p src/lib/email
mkdir -p src/types
```

## 类型定义初始化

### 3.1 创建类型文件

- [ ] 创建 `src/types/auth.ts`：

```typescript
export interface User {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  role: 'admin' | 'user';
  status: 'active' | 'disabled';
  permissions: {
    directories: string[];
    operations: ('read' | 'write' | 'delete' | 'admin')[];
  };
  createdAt: string;
  updatedAt: string;
}

export interface PublicUser {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'user';
  status: 'active' | 'disabled';
  permissions: {
    directories: string[];
    operations: ('read' | 'write' | 'delete' | 'admin')[];
  };
  createdAt: string;
  updatedAt: string;
}

export interface Session {
  user: PublicUser;
  expiresAt: number;
}
```

- [ ] 创建 `src/types/config.ts`：

```typescript
import type { User } from './auth';

export interface SystemConfig {
  notesRootPath: string;
}

export interface AppConfig {
  system: SystemConfig;
  users: User[];
}
```

- [ ] 创建 `src/types/file.ts`：

```typescript
export interface FileNode {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: FileNode[];
  createdAt: string;
  updatedAt: string;
  size?: number;
}

export interface FileContent {
  content: string;
  metadata: FileNode;
}
```

- [ ] 创建 `src/types/api.ts`：

```typescript
// 通用响应格式
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

// 登录
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    username: string;
    role: string;
    email: string;
  };
}
```

---

## 初始页面框架

### 4.1 更新根布局

- [ ] 编辑 `src/app/layout.tsx`：
  - 添加 Toaster 组件
  - 配置中文字体支持


### 4.3 创建重置密码页面占位

- [ ] 创建 `src/app/reset-password/page.tsx`：

```typescript
export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-sm">重置密码页面占位</div>
    </div>
  );
}
```

### 4.4 初始化 git 并提交 first commit


## 验证

- [ ] `pnpm install` 正常完成，无警告或错误
- [ ] `pnpm dev` 能正常启动（无需完全运行，观察启动日志无报错即可）
- [ ] `pnpm tsc --noEmit` 无 TypeScript 编译错误
- [ ] `pnpm lint` 无 ESLint 错误
- [ ] 访问 `/reset-password` 页面显示占位内容
- [ ] 确认 `src/` 目录下文件结构符合预期
- [ ] 确认 `config.json` 已创建
- [ ] 确认 `.env.example` 已创建

---

## 执行此步骤后应达到的状态

1. Next.js 项目已创建并配置完成
2. shadcn/ui 组件库已安装并初始化
3. 所有后端依赖已安装（bcryptjs, jose, nodemailer, zod）
4. 基础目录结构已创建
5. 类型定义文件已创建
6. 重置密码页面的占位组件已创建
7. 环境变量示例文件已创建
8. `config.json` 已创建（初始空配置）
9. TypeScript 编译无错误
10. ESLint 检查无错误
