# 项目目录结构设计

## 设计原则

1. **关注点分离**: 按功能模块组织代码，便于维护和扩展
2. **API 分层**: OpenAPI 接口、Server Actions、内部工具职责分明
3. **权限控制**: 多层权限检查（Layout、Middleware、Actions）
4. **可扩展性**: 预留扩展空间

---

## 完整目录结构

```
ai-notebook/
├── app/                          # Next.js App Router
│   ├── layout.tsx               # 根布局
│   ├── page.tsx                 # 重定向到 /login 或 /
│   ├── globals.css              # 全局样式
│   ├── login/                   # 登录页面
│   │   └── page.tsx
│   ├── reset-password/          # 重置密码页面（邮件验证码）
│   │   └── page.tsx
│   ├── (protected)/             # 受保护路由组
│   │   ├── layout.tsx           # 登录权限检查
│   │   ├── page.tsx             # 首页 (sidebar + editor)
│   │   ├── [folderId]/          # 文件夹路由
│   │   │   ├── page.tsx         # 文件夹笔记列表
│   │   │   └── [nodeId]/        # 笔记详情
│   │   │       └── page.tsx
│   │   └── settings/            # 设置页面 (仅管理员)
│   │       └── page.tsx
│   ├── api/                     # OpenAPI 规范接口
│   │   ├── openapi.json/        # OpenAPI 文档
│   │   │   └── route.ts
│   │   ├── auth/
│   │   │   └── login/           # 登录接口
│   │   │       └── route.ts
│   │   └── files/               # 文件操作接口
│   │       ├── route.ts         # GET 列表, POST 创建
│   │       └── [...path]/
│   │           └── route.ts     # GET/PUT/DELETE 单个文件
│   └── actions/                 # Server Actions
│       ├── auth.ts              # 重置密码（发送验证码、验证重置）
│       ├── users.ts             # 用户管理（增删改查、权限、状态）
│       └── config.ts            # 系统配置（笔记根目录）
├── components/                  # React 组件
│   ├── ui/                      # shadcn/ui 组件
│   │   ├── button.tsx
│   │   └── ...
│   ├── auth/
│   │   ├── login-form.tsx       # 登录表单
│   │   └── reset-password-form.tsx  # 重置密码表单（验证码+新密码）
│   ├── layout/
│   │   ├── sidebar.tsx          # 侧边栏
│   │   ├── header.tsx           # 顶部导航（含用户菜单）
│   │   └── file-tree.tsx        # 文件树
│   ├── editor/
│   │   ├── plate-editor.tsx     # Plate 编辑器
│   │   └── toolbar.tsx          # 编辑器工具栏
│   └── settings/
│       ├── user-list.tsx        # 用户列表
│       ├── user-form.tsx        # 用户表单（新增/编辑）
│       └── system-config.tsx    # 系统配置（笔记根目录路径）
├── lib/
│   ├── auth/
│   │   ├── jwt.ts               # JWT 生成/验证
│   │   ├── password.ts          # 密码加密/验证（bcrypt）
│   │   ├── session.ts           # 会话管理（Cookie 读写）
│   │   └── permissions.ts       # 权限检查
│   ├── config/
│   │   └── manager.ts           # 配置文件管理（读写 config.json）
│   ├── fs/
│   │   └── notes.ts             # 笔记文件操作
│   ├── email/
│   │   └── sender.ts            # 邮件发送（验证码）
│   ├── openapi/
│   │   └── generator.ts         # OpenAPI 文档生成
│   └── utils.ts                 # 通用工具
├── types/
│   ├── auth.ts                  # 用户、会话类型
│   ├── config.ts                # 配置类型
│   ├── file.ts                  # 文件类型
│   └── api.ts                   # API 类型
├── config.json                  # 应用配置（gitignore）
├── .env.example                 # 环境变量示例
├── middleware.ts                # API 权限中间件
└── next.config.ts               # Next.js 配置
```

---

## 核心模块详解

### app/ 路由结构

| 路径 | 文件 | 功能 | 权限 |
|------|------|------|------|
| `/login` | `login/page.tsx` | 登录页面 | 公开 |
| `/reset-password` | `reset-password/page.tsx` | 重置密码（邮件验证码） | 公开 |
| `/` | `(protected)/page.tsx` | 首页（sidebar + editor） | 需登录 |
| `/[folderId]` | `(protected)/[folderId]/page.tsx` | 文件夹笔记列表 | 需登录 |
| `/[folderId]/[nodeId]` | `(protected)/[folderId]/[nodeId]/page.tsx` | 笔记详情 | 需登录 |
| `/settings` | `(protected)/settings/page.tsx` | 用户管理、系统设置 | 仅管理员 |

---

### app/api/ - OpenAPI 规范接口

| 文件 | 功能 | 方法 | 权限 |
|------|------|------|------|
| `openapi.json/route.ts` | 生成 OpenAPI 文档 | GET | 公开 |
| `auth/login/route.ts` | 用户登录 | POST | 公开 |
| `files/route.ts` | 文件列表/创建 | GET, POST | 需登录 |
| `files/[...path]/route.ts` | 单个文件操作 | GET, PUT, DELETE | 需登录 |

**统一响应格式**:
```typescript
// 成功
{ success: true, data: T }

// 失败
{ success: false, error: { code: string, message: string } }
```

---

### app/actions/ - Server Actions

| 文件 | 功能 | 权限 |
|------|------|------|
| `auth.ts` | `sendResetCode(email)` - 发送重置验证码<br>`resetPassword(code, newPassword)` - 重置密码 | 公开 |
| `users.ts` | `createUser(data)` - 创建用户<br>`updateUser(id, data)` - 更新用户<br>`deleteUser(id)` - 删除用户<br>`toggleUserStatus(id, status)` - 启用/禁用用户<br>`updateUserPermissions(id, permissions)` - 更新权限 | 仅管理员 |
| `config.ts` | `updateNotesRootPath(path)` - 修改笔记根目录 | 仅管理员 |

**权限检查方式**:
```typescript
'use server';

export async function createUser(data: CreateUserData) {
  const session = await getSession();
  if (!session || session.user.role !== 'admin') {
    throw new Error('权限不足');
  }
  // ...
}
```

---

### lib/auth/ - 认证工具

| 文件 | 职责 | 核心函数 |
|------|------|----------|
| `jwt.ts` | JWT 操作 | `signToken()`, `verifyToken()` |
| `password.ts` | 密码加密（bcrypt） | `hashPassword()`, `verifyPassword()` |
| `session.ts` | 会话管理 | `getSession()`, `setSession()`, `clearSession()` |
| `permissions.ts` | 权限检查 | `hasPermission()`, `checkPermission()` |

---

### lib/config/manager.ts - 配置管理

```typescript
// 核心功能
loadConfig(): AppConfig                    // 读取 config.json
saveConfig(config: AppConfig): void        // 保存 config.json
getUsers(): User[]                         // 获取用户列表
getUserByUsername(username: string): User | null
updateUser(id: string, data: Partial<User>): void
deleteUser(id: string): void
updateNotesRootPath(path: string): void
```

---

### middleware.ts - API 权限控制

```typescript
// 匹配 /api/* 路径
export const config = {
  matcher: '/api/:path*',
};

// 公开路径: /api/openapi.json, /api/auth/login
// 其他路径: 验证 JWT Token
```

---

### app/(protected)/layout.tsx - 页面权限控制

```typescript
// 检查登录状态
// 未登录 -> 重定向到 /login
// 已登录 -> 渲染子组件
```

---

## 配置文件说明

### config.json 结构

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

**用户字段说明**:
- `id`: 唯一标识
- `username`: 登录用户名
- `passwordHash`: bcrypt 加密后的密码
- `email`: 邮箱（用于重置密码）
- `role`: 角色（`admin` 或 `user`）
- `status`: 状态（`active` 或 `disabled`）
- `permissions`: 权限配置
  - `directories`: 可访问的目录列表（`["*"]` 表示全部）
  - `operations`: 可操作类型（`read`, `write`, `delete`, `admin`）

### .env.example

```bash
# JWT 密钥（openssl rand -base64 32 生成）
AUTH_SECRET=your-secret-key

# SMTP 邮件配置（用于发送重置密码验证码）
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=noreply@example.com
SMTP_PASS=your-password
SMTP_FROM=AI Notebook <noreply@example.com>
```

---

## 文件命名规范

| 类型 | 命名规则 | 示例 |
|------|----------|------|
| 页面组件 | `page.tsx` | `app/login/page.tsx` |
| 布局组件 | `layout.tsx` | `app/(protected)/layout.tsx` |
| API 路由 | `route.ts` | `app/api/files/route.ts` |
| Server Actions | camelCase.ts | `app/actions/users.ts` |
| React 组件 | PascalCase.tsx | `components/auth/LoginForm.tsx` |
| 工具函数 | camelCase.ts | `lib/auth/jwt.ts` |
| 类型定义 | camelCase.ts | `types/auth.ts` |

---

## 权限控制矩阵

| 功能 | 路径/位置 | 控制方式 | 权限要求 |
|------|-----------|----------|----------|
| 登录页面 | `/login` | 公开路由 | 无 |
| 重置密码 | `/reset-password` | 公开路由 | 邮箱验证码 |
| 首页 | `/` | Layout 检查 | 已登录 |
| 文件夹 | `/[folderId]` | Layout + 权限检查 | 已登录 + 目录权限 |
| 笔记详情 | `/[folderId]/[nodeId]` | Layout + 权限检查 | 已登录 + 目录权限 |
| 设置 | `/settings` | Layout + 页面检查 | 管理员 |
| 登录 API | `/api/auth/login` | 公开 | 无 |
| OpenAPI 文档 | `/api/openapi.json` | 公开 | 无 |
| 文件 API | `/api/files/*` | Middleware | 已登录 + 目录权限 |
| 重置密码 Action | `app/actions/auth.ts` | Action 内部检查 | 邮箱验证码 |
| 用户管理 | `app/actions/users.ts` | Action 内部检查 | 管理员 |
| 系统配置 | `app/actions/config.ts` | Action 内部检查 | 管理员 |

---

## OpenAPI 接口清单

| 接口 | 方法 | 描述 | 请求体 | 响应 |
|------|------|------|--------|------|
| `/api/auth/login` | POST | 用户登录 | `{ username, password }` | `{ token, user }` |
| `/api/files` | GET | 获取文件列表 | Query: `?path=` | `FileNode[]` |
| `/api/files` | POST | 创建文件/文件夹 | `{ path, type, content? }` | `FileNode` |
| `/api/files/{path}` | GET | 读取文件内容 | - | `{ content, metadata }` |
| `/api/files/{path}` | PUT | 更新文件内容 | `{ content }` | `{ success }` |
| `/api/files/{path}` | DELETE | 删除文件/文件夹 | - | `{ success }` |
| `/api/openapi.json` | GET | OpenAPI 文档 | - | OpenAPI JSON |

---

## 扩展性考虑

### 未来可能的扩展

1. **多工作区**
   ```json
   {
     "workspaces": [
       { "id": "personal", "path": "/path/1" },
       { "id": "work", "path": "/path/2" }
     ]
   }
   ```

2. **LDAP/SSO 集成**
   ```
   lib/auth/ldap.ts
   lib/auth/oauth.ts
   ```

3. **笔记版本历史**
   ```
   lib/fs/version.ts
   ```

---

## 验证清单

- [ ] 目录结构清晰合理
- [ ] 路由层级符合需求（/login, /reset-password, /, /[folderId], /[folderId]/[nodeId], /settings）
- [ ] OpenAPI 接口路径正确（/api/auth/login, /api/files/*, /api/openapi.json）
- [ ] Server Actions 路径正确（app/actions/auth.ts, users.ts, config.ts）
- [ ] 权限控制层级清晰（Layout, Middleware, Action 内部检查）
- [ ] 配置文件结构完整（config.json 包含 system 和 users）
