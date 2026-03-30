# Markdown 笔记本应用开发计划

## 项目概述

开发一个基于 Next.js + shadcn/ui + Plate.js 的 Markdown 笔记本应用，支持 JWT 认证、用户权限管理、OpenAPI 规范接口。

---

## 技术栈

| 技术 | 用途 | 版本 |
|------|------|------|
| Next.js | React 框架 (App Router) | 16.x |
| React | UI 库 | 19.x |
| TypeScript | 类型安全 | 5.x |
| Tailwind CSS | 样式系统 | 4.x |
| shadcn/ui | UI 组件库 | latest |
| Plate.js | 富文本/Markdown 编辑器 | latest |
| bcryptjs | 密码加密 | latest |
| jose | JWT 签名验证 | latest |
| nodemailer | 邮件发送 | latest |
| zod | 数据验证 | latest |

---

## 目录结构

详细目录结构设计见 [./plans/directory-structure.md](./plans/directory-structure.md)

---

## 系统架构

### API 分层设计

| 类型 | 路径 | 说明 |
|------|------|------|
| **OpenAPI 规范接口** | `/api/*` | 登录、笔记文件操作 |
| **Server Actions** | `app/actions/*` | 重置密码、用户管理、系统设置 |
| **Server Client** | `lib/*` | 内部工具函数 |

### OpenAPI 接口清单

| 接口 | 方法 | 功能 | 权限 |
|------|------|------|------|
| `/api/auth/login` | POST | 登录获取 JWT | 公开 |
| `/api/files` | GET | 获取文件列表 | 需登录 |
| `/api/files` | POST | 创建文件/文件夹 | 需登录 |
| `/api/files/[...path]` | GET | 读取文件内容 | 需登录 |
| `/api/files/[...path]` | PUT | 更新文件内容 | 需登录 |
| `/api/files/[...path]` | DELETE | 删除文件/文件夹 | 需登录 |
| `/api/openapi.json` | GET | OpenAPI 文档 | 公开 |

### Server Actions 清单

| Action | 功能 | 权限 |
|--------|------|------|
| `sendResetCode(email)` | 发送重置密码验证码 | 公开 |
| `resetPassword(code, newPassword)` | 重置密码 | 公开(需验证码) |
| `createUser(data)` | 创建用户 | 仅管理员 |
| `updateUser(id, data)` | 更新用户 | 仅管理员 |
| `deleteUser(id)` | 删除用户 | 仅管理员 |
| `toggleUserStatus(id, status)` | 启用/禁用用户 | 仅管理员 |
| `updateUserPermissions(id, permissions)` | 更新用户权限 | 仅管理员 |
| `updateNotesRootPath(path)` | 修改笔记根目录 | 仅管理员 |

---

## 数据结构设计

### config.json

```json
{
  "system": {
    "notesRootPath": "/path/to/notes"
  },
  "users": [
    {
      "id": "admin",
      "username": "admin",
      "passwordHash": "$2a$10$...",
      "email": "admin@example.com",
      "role": "admin",
      "status": "active",
      "permissions": {
        "directories": ["*"],
        "operations": ["read", "write", "delete", "admin"]
      },
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### 类型定义

```typescript
// types/auth.ts
interface User {
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

interface Session {
  user: Omit<User, 'passwordHash'>;
  expiresAt: number;
}

// types/config.ts
interface SystemConfig {
  notesRootPath: string;
}

interface AppConfig {
  system: SystemConfig;
  users: User[];
}

// types/file.ts
interface FileNode {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: FileNode[];
  createdAt: string;
  updatedAt: string;
  size?: number;
}
```

---

## 页面路由设计

| 路由 | 文件 | 功能 | 访问权限 |
|------|------|------|----------|
| `/login` | `app/login/page.tsx` | 登录页面 | 公开 |
| `/reset-password` | `app/reset-password/page.tsx` | 重置密码(邮件验证码) | 公开 |
| `/` | `app/(protected)/page.tsx` | 首页 (sidebar + editor) | 需登录 |
| `/[folderId]` | `app/(protected)/[folderId]/page.tsx` | 文件夹笔记列表 | 需登录 |
| `/[folderId]/[nodeId]` | `app/(protected)/[folderId]/[nodeId]/page.tsx` | 笔记详情 | 需登录 |
| `/settings` | `app/(protected)/settings/page.tsx` | 用户管理、系统设置 | 仅管理员 |

---

## 认证系统设计

### JWT 配置

- **算法**: HS256
- **存储**: HTTP-only Cookie
- **有效期**: 7天 (可配置)
- **刷新**: 每次请求自动续期

### 密码加密

- **算法**: bcrypt
- **cost factor**: 10
- **生成命令**: `npx bcryptjs-cli "password"`

### 权限控制策略

| 层级 | 实现方式 |
|------|----------|
| 页面路由 | `(protected)/layout.tsx` 检查登录状态 |
| OpenAPI 接口 | `middleware.ts` 验证 JWT Token |
| Server Actions | 内部调用 `getSession()` 验证 |
| 文件操作 | `checkPermission()` 检查目录权限 |

### 权限检查逻辑

```typescript
function hasPermission(
  user: User,
  path: string,
  operation: 'read' | 'write' | 'delete'
): boolean {
  // 禁用用户拒绝
  if (user.status === 'disabled') return false;

  // 管理员通过
  if (user.role === 'admin') return true;

  // 检查操作权限
  if (!user.permissions.operations.includes(operation)) {
    return false;
  }

  // 检查目录权限
  if (user.permissions.directories.includes('*')) return true;

  return user.permissions.directories.some(dir =>
    path.startsWith(dir)
  );
}
```

---

## OpenAPI 规范

### 文档路径

- JSON: `/api/openapi.json`
- UI: `/api/docs` (使用 Swagger UI 或 Redoc)

### 认证方式

```yaml
securitySchemes:
  bearerAuth:
    type: http
    scheme: bearer
    bearerFormat: JWT
```

### 核心接口定义

```yaml
paths:
  /api/auth/login:
    post:
      summary: 用户登录
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [username, password]
              properties:
                username: { type: string }
                password: { type: string }
      responses:
        200:
          description: 登录成功
          content:
            application/json:
              schema:
                type: object
                properties:
                  token: { type: string }
                  user:
                    type: object
                    properties:
                      id: { type: string }
                      username: { type: string }
                      role: { type: string }
        401:
          description: 认证失败

  /api/files:
    get:
      summary: 获取文件列表
      security: [{ bearerAuth: [] }]
      parameters:
        - name: path
          in: query
          schema: { type: string }
      responses:
        200:
          description: 文件列表
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/FileNode'

    post:
      summary: 创建文件或文件夹
      security: [{ bearerAuth: [] }]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [path, type]
              properties:
                path: { type: string }
                type: { type: string, enum: [file, folder] }
                content: { type: string }
      responses:
        201:
          description: 创建成功

  /api/files/{path}:
    get:
      summary: 读取文件内容
      security: [{ bearerAuth: [] }]
      parameters:
        - name: path
          in: path
          required: true
          schema: { type: string }
      responses:
        200:
          description: 文件内容
          content:
            application/json:
              schema:
                type: object
                properties:
                  content: { type: string }
                  metadata:
                    $ref: '#/components/schemas/FileNode'

    put:
      summary: 更新文件内容
      security: [{ bearerAuth: [] }]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [content]
              properties:
                content: { type: string }
      responses:
        200:
          description: 更新成功

    delete:
      summary: 删除文件或文件夹
      security: [{ bearerAuth: [] }]
      responses:
        204:
          description: 删除成功

components:
  schemas:
    FileNode:
      type: object
      required: [id, name, path, type]
      properties:
        id: { type: string }
        name: { type: string }
        path: { type: string }
        type: { type: string, enum: [file, folder] }
        children:
          type: array
          items:
            $ref: '#/components/schemas/FileNode'
        createdAt: { type: string, format: date-time }
        updatedAt: { type: string, format: date-time }
        size: { type: number }
```

---

## 功能模块设计

### 模块 1: 认证系统

**职责**: JWT 认证、会话管理、密码重置

**实现文件**:
- `lib/auth/jwt.ts` - JWT 生成与验证
- `lib/auth/password.ts` - 密码加密与验证
- `lib/auth/session.ts` - 会话管理
- `lib/auth/permissions.ts` - 权限检查
- `app/api/auth/login/route.ts` - 登录接口
- `app/actions/auth.ts` - 重置密码 Actions

### 模块 2: 用户管理

**职责**: 用户 CRUD、权限配置、状态管理

**实现文件**:
- `app/actions/users.ts` - 用户管理 Actions
- `app/(protected)/settings/page.tsx` - 设置页面
- `components/settings/user-list.tsx` - 用户列表
- `components/settings/user-form.tsx` - 用户表单

### 模块 3: 文件系统 (OpenAPI)

**职责**: 笔记文件的 CRUD 操作

**实现文件**:
- `lib/fs/notes.ts` - 文件系统工具
- `app/api/files/route.ts` - 文件列表/创建
- `app/api/files/[...path]/route.ts` - 单个文件操作
- `middleware.ts` - API 权限验证

### 模块 4: Markdown 编辑器

**职责**: 基于 Plate.js 的富文本编辑器

**实现文件**:
- `components/editor/plate-editor.tsx` - 主编辑器
- `components/editor/toolbar.tsx` - 工具栏

### 模块 5: 文件浏览器

**职责**: 侧边栏目录树展示

**实现文件**:
- `components/layout/sidebar.tsx` - 侧边栏
- `components/layout/file-tree.tsx` - 文件树

### 模块 6: OpenAPI 文档

**职责**: 生成 OpenAPI 规范文档

**实现文件**:
- `lib/openapi/generator.ts` - 文档生成器
- `app/api/openapi.json/route.ts` - 文档路由

---

## 权限控制实现

### 1. 页面路由权限 (Layout)

```typescript
// app/(protected)/layout.tsx
export default async function ProtectedLayout({ children }) {
  const session = await getSession();
  if (!session) redirect('/login');
  return <>{children}</>;
}

// app/(protected)/settings/page.tsx
export default async function SettingsPage() {
  const session = await getSession();
  if (session.user.role !== 'admin') redirect('/');
  return <Settings />;
}
```

### 2. API 权限 (Middleware)

```typescript
// middleware.ts
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // OpenAPI 文档公开
  if (pathname === '/api/openapi.json') {
    return NextResponse.next();
  }

  // 登录接口公开
  if (pathname === '/api/auth/login') {
    return NextResponse.next();
  }

  // 其他 API 需要认证
  const token = request.cookies.get('token')?.value;
  const session = await verifyToken(token);

  if (!session) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
```

### 3. Server Actions 权限

```typescript
// app/actions/users.ts
'use server';

export async function createUser(data: CreateUserData) {
  const session = await getSession();
  if (!session || session.user.role !== 'admin') {
    throw new Error('权限不足');
  }
  // ... 创建用户
}
```

---

## 配置文件

### .env.example

```bash
# JWT 密钥 (openssl rand -base64 32)
AUTH_SECRET=your-secret-key

# 邮件配置 (SMTP)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=noreply@example.com
SMTP_PASS=your-password
SMTP_FROM=AI Notebook <noreply@example.com>
```

### config.json (运行时生成)

```json
{
  "system": {
    "notesRootPath": "/path/to/notes"
  },
  "users": []
}
```

---

## 实现步骤

### 阶段 1: 项目初始化

1. 初始化 Next.js 项目
2. 配置 shadcn/ui
3. 安装依赖 (bcryptjs, jose, nodemailer, zod)

### 阶段 2: 认证系统

1. 实现 JWT 工具函数
2. 实现密码加密工具
3. 实现配置文件管理
4. 创建登录页面
5. 创建登录 API
6. 创建重置密码功能

### 阶段 3: OpenAPI 文件接口

1. 实现文件系统工具
2. 创建 `/api/files` 接口
3. 实现 API 权限中间件
4. 生成 OpenAPI 文档

### 阶段 4: 前端界面

1. 创建 (protected) 布局
2. 实现侧边栏文件树
3. 集成 Plate.js 编辑器
4. 创建设置页面

### 阶段 5: 用户管理

1. 实现用户管理 Actions
2. 创建用户列表组件
3. 创建用户表单组件
4. 实现权限配置

---

## 验证清单

- [ ] 登录功能正常
- [ ] JWT Token 正确生成和验证
- [ ] 重置密码邮件发送正常
- [ ] OpenAPI 文档可访问
- [ ] 文件列表接口正常
- [ ] 文件 CRUD 接口正常
- [ ] 权限控制有效
- [ ] 用户管理功能完整
- [ ] 侧边栏目录树显示正常
- [ ] 编辑器功能正常
