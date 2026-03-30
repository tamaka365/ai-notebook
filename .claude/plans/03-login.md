# 步骤 3：登录页面与登录 API

## 背景

步骤 1（项目初始化）和步骤 2（重置密码）已完成：Next.js + shadcn/ui + Tailwind 已配置，bcryptjs/jose/nodemailer/zod 已安装，类型定义、邮件发送、重置密码表单均已实现。

本步骤目标是实现完整的登录功能，包括：JWT 认证基础设施（密码加密、JWT 签发/验证、SESSION 管理）、登录 API、登录页面组件，并配置中间件开放登录接口、其余 API 需认证。

---

## 前端

### 1.1 登录表单组件

**文件**: `src/components/auth/LoginForm.tsx`（新建）

**功能**:
- 用户名、密码输入框 + 提交按钮
- 调用 `POST /api/auth/login` 接口
- 成功：跳转首页 `/`（由 `/login/page.tsx` 在 Client Component 提交后用 `router.push` 跳转）
- 失败：显示错误提示
- 底部添加「忘记密码」链接指向 `/reset-password`
- 复用 shadcn/ui 组件：`Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `Button`, `Input`, `Label`, `Alert`, `AlertDescription`

**表单字段**:
| 字段 | 类型 | 验证 |
|------|------|------|
| username | text | 非空 |
| password | password | 非空 |

**状态**:
- `isLoading: boolean` - 提交中禁用按钮
- `error: string | null` - 错误提示

**样式**:
- 使用 `Card` 包裹表单，居中显示（参考 `ResetPasswordForm` 布局）
- 暗黑模式兼容

### 1.2 登录页面

**文件**: `src/app/login/page.tsx`（新建）

**功能**:
- 导入并渲染 `<LoginForm />`
- 布局同 `reset-password`：全屏居中卡片，深色背景

```tsx
// src/app/login/page.tsx
export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
      <LoginForm />
    </div>
  );
}
```

### 1.3 根页面重定向

**文件**: `src/app/page.tsx`（修改现有）

**功能**: 已登录用户直接跳转 `/notes`，未登录则跳转到 `/login`

需要从 `lib/auth/session.ts` 导入 `getSession()`：

```tsx
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";

export default async function Home() {
  const session = await getSession();
  if (session) redirect("/notes"); // 后续步骤实现
  redirect("/login");
}
```

---

## 后端

### 2.1 密码加密工具

**文件**: `src/lib/auth/password.ts`（新建）

**功能**: bcrypt 加密与验证

```typescript
import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10;

/**
 * 加密密码
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * 验证密码
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
```

**注意**: `hashPassword` 是异步的（bcryptjs 的 `hash` 返回 Promise），`verifyPassword` 也是异步的。

### 2.2 JWT 工具

**文件**: `src/lib/auth/jwt.ts`（新建）

**功能**: JWT 签发与验证，使用 `jose` 库

```typescript
import { SignJWT, jwtVerify } from "jose";
import type { Session, PublicUser } from "@/types/auth";

const getSecret = () =>
  new TextEncoder().encode(process.env.AUTH_SECRET ?? "fallback-secret");

/**
 * 签发 JWT Token
 * @param payload 用户公开信息
 * @param expiresIn 过期时间，默认 7 天
 */
export async function signToken(
  payload: PublicUser,
  expiresIn = "7 days"
): Promise<string> {
  const secret = getSecret();
  return new SignJWT({ user: payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(secret);
}

/**
 * 验证 JWT Token
 * @returns Session 或 null（无效/过期）
 */
export async function verifyToken(
  token: string
): Promise<Session | null> {
  try {
    const secret = getSecret();
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as Session;
  } catch {
    return null;
  }
}
```

**JWT 负载结构**:
```typescript
interface Session {
  user: PublicUser; // 不包含 passwordHash
  expiresAt: number; // 自动由 jose 设置
}
```

### 2.3 会话管理工具

**文件**: `src/lib/auth/session.ts`（新建）

**功能**: 基于 HTTP-only Cookie 的会话读写

```typescript
import { cookies } from "next/headers";
import { verifyToken, signToken } from "./jwt";
import type { Session, PublicUser } from "@/types/auth";

const TOKEN_COOKIE_NAME = "ai_notebook_token";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 天

/**
 * 从 Cookie 中读取并验证会话
 */
export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

/**
 * 创建会话（签发 JWT 并写入 HTTP-only Cookie）
 */
export async function setSession(user: PublicUser): Promise<void> {
  const cookieStore = await cookies();
  const token = await signToken(user);
  cookieStore.set(TOKEN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });
}

/**
 * 清除会话（删除 Cookie）
 */
export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(TOKEN_COOKIE_NAME);
}
```

**Cookie 配置说明**:
- `httpOnly: true` - 防止 XSS 读取
- `secure: true` - 生产环境启用 HTTPS
- `sameSite: "lax"` - 允许同站 GET 请求携带
- `maxAge: 7天` - 与 JWT 过期时间一致

### 2.4 权限检查工具

**文件**: `src/lib/auth/permissions.ts`（新建）

**功能**: 检查用户对目录和操作的权限

```typescript
import type { User } from "@/types/auth";

/**
 * 检查用户是否有权限执行操作
 */
export function hasPermission(
  user: User,
  path: string,
  operation: "read" | "write" | "delete"
): boolean {
  // 禁用用户拒绝
  if (user.status === "disabled") return false;

  // 管理员通过
  if (user.role === "admin") return true;

  // 检查操作权限
  if (!user.permissions.operations.includes(operation)) {
    return false;
  }

  // 检查目录权限
  if (user.permissions.directories.includes("*")) return true;

  return user.permissions.directories.some((dir) => path.startsWith(dir));
}

/**
 * 权限不足时抛出错误
 */
export function checkPermission(
  user: User,
  path: string,
  operation: "read" | "write" | "delete"
): void {
  if (!hasPermission(user, path, operation)) {
    throw new Error("权限不足");
  }
}
```

### 2.5 Config Manager 扩展

**文件**: `src/lib/config/manager.ts`（修改现有）

新增以下函数：

```typescript
/**
 * 根据用户名查找用户
 */
export function getUserByUsername(username: string): User | null {
  const config = readConfig();
  return config.users.find((u) => u.username === username) ?? null;
}

/**
 * 根据 ID 查找用户
 */
export function getUserById(id: string): User | null {
  const config = readConfig();
  return config.users.find((u) => u.id === id) ?? null;
}
```

### 2.6 登录 API

**文件**: `src/app/api/auth/login/route.ts`（新建）

**功能**: 验证用户名密码，成功则签发 JWT

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getUserByUsername } from "@/lib/config/manager";
import { verifyPassword } from "@/lib/auth/password";
import { setSession } from "@/lib/auth/session";
import type { ApiResponse, LoginRequest, LoginResponse } from "@/types/api";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as LoginRequest;

    // 1. 验证必填字段
    if (!body.username || !body.password) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: { code: "INVALID_INPUT", message: "用户名和密码不能为空" },
        },
        { status: 400 }
      );
    }

    // 2. 查找用户
    const user = getUserByUsername(body.username);
    if (!user) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: { code: "INVALID_CREDENTIALS", message: "用户名或密码错误" },
        },
        { status: 401 }
      );
    }

    // 3. 检查用户状态
    if (user.status === "disabled") {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: { code: "ACCOUNT_DISABLED", message: "账号已被禁用" },
        },
        { status: 403 }
      );
    }

    // 4. 验证密码
    const isValid = await verifyPassword(body.password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: { code: "INVALID_CREDENTIALS", message: "用户名或密码错误" },
        },
        { status: 401 }
      );
    }

    // 5. 构建公开用户信息（不含 passwordHash）
    const { passwordHash: _, ...publicUser } = user;

    // 6. 创建会话（写入 HTTP-only Cookie）
    await setSession(publicUser);

    // 7. 返回 Token 和用户信息
    const response: ApiResponse<LoginResponse> = {
      success: true,
      data: {
        token: "", // Token 已写入 Cookie，前端可从 Cookie 读取
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          email: user.email,
        },
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("登录失败:", error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: { code: "INTERNAL_ERROR", message: "服务器内部错误" },
      },
      { status: 500 }
    );
  }
}
```

**注意**: Token 不在响应体返回，而是通过 HTTP-only Cookie 设置。这样更安全，避免 XSS 盗取 Token。

### 2.7 Proxy（Next.js 16 规范）

**文件**: `src/proxy.ts`（新建）

> **注意**: Next.js 16+ 将 `middleware.ts` 重命名为 `proxy.ts`，`middleware` 函数重命名为 `proxy`。使用 Node.js 运行时（默认），不再是 Edge Runtime。

**功能**:
1. 公开路径：`/login`, `/reset-password`, `/api/auth/login`, `/api/openapi.json`
2. 其余 `/api/*` 路径：验证 JWT Token，无效则返回 401

```typescript
import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth/jwt";

// 公开路径列表
const PUBLIC_PATHS = [
  "/login",
  "/reset-password",
  "/api/auth/login",
  "/api/openapi.json",
  "/_next",
  "/favicon.ico",
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. 检查是否公开路径
  const isPublic = PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(path + "/")
  ) || pathname.startsWith("/_next/");

  if (isPublic) {
    return NextResponse.next();
  }

  // 2. 检查 /api/* 路径
  if (pathname.startsWith("/api/")) {
    const token = request.cookies.get("ai_notebook_token")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "请先登录" } },
        { status: 401 }
      );
    }

    const session = verifyToken(token);
    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: "TOKEN_INVALID", message: "登录已过期，请重新登录" } },
        { status: 401 }
      );
    }

    // 将用户信息传递给后续处理器
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-user-id", session.user.id);
    requestHeaders.set("x-user-role", session.user.role);

    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // 3. 其他受保护页面（未登录则跳转登录）
  if (
    pathname !== "/login" &&
    !pathname.startsWith("/api/") &&
    !pathname.startsWith("/_next")
  ) {
    const token = request.cookies.get("ai_notebook_token")?.value;
    const session = token ? verifyToken(token) : null;

    if (!session) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * 匹配所有路径除了:
     * - _next/static (静态文件)
     * - _next/image (图片优化)
     * - favicon.ico (图标)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
```

---

## 类型定义

### 3.1 登录验证 Schema

**文件**: `src/lib/validations/auth.ts`（修改现有）

新增登录验证 schema：

```typescript
export const loginSchema = z.object({
  username: z.string().min(1, "请输入用户名"),
  password: z.string().min(1, "请输入密码"),
});
```

---

## 文件清单

### 新建文件

| 文件路径 | 用途 |
|----------|------|
| `src/lib/auth/password.ts` | 密码加密与验证（bcrypt） |
| `src/lib/auth/jwt.ts` | JWT 签发与验证（jose） |
| `src/lib/auth/session.ts` | 会话管理（Cookie 读写） |
| `src/lib/auth/permissions.ts` | 权限检查工具 |
| `src/app/api/auth/login/route.ts` | 登录 API（POST） |
| `src/proxy.ts` | Proxy（Next.js 16 规范，原 `middleware.ts` 已废弃） |
| `src/components/auth/LoginForm.tsx` | 登录表单组件 |
| `src/app/login/page.tsx` | 登录页面 |

### 修改文件

| 文件路径 | 修改内容 |
|----------|----------|
| `src/lib/config/manager.ts` | 新增 `getUserByUsername`、`getUserById` |
| `src/lib/validations/auth.ts` | 新增 `loginSchema` |
| `src/app/page.tsx` | 改为重定向到 `/login` |

### 目录结构（步骤 3 完成后）

```
src/
├── app/
│   ├── page.tsx                          ← 修改：重定向逻辑
│   ├── login/
│   │   └── page.tsx                      ← 新建
│   ├── reset-password/
│   │   └── page.tsx                      ← 已存在
│   ├── actions/
│   │   └── auth.ts                       ← 已存在
│   └── api/
│       └── auth/
│           └── login/
│               └── route.ts              ← 新建
├── components/
│   └── auth/
│       ├── LoginForm.tsx                 ← 新建
│       └── ResetPasswordForm.tsx         ← 已存在
└── lib/
    ├── auth/
    │   ├── jwt.ts                        ← 新建
    │   ├── password.ts                   ← 新建
    │   ├── session.ts                    ← 新建
    │   └── permissions.ts               ← 新建
    ├── config/
    │   └── manager.ts                    ← 修改：新增函数
    ├── email/
    │   └── sender.ts                     ← 已存在
    └── validations/
        └── auth.ts                       ← 修改：新增 schema
proxy.ts                                  ← 新建（替代 middleware.ts）
```

---

## 验证清单

- [ ] `pnpm tsc --noEmit` 无 TypeScript 编译错误
- [ ] `pnpm lint` 无 ESLint 错误
- [ ] 访问 `/login` 页面正常显示登录表单
- [ ] `POST /api/auth/login` 正确验证用户名密码
  - 用户名不存在返回 401
  - 密码错误返回 401
  - 禁用账号返回 403
  - 成功登录返回 200，Cookie 中有 `ai_notebook_token`
- [ ] 访问 `/api/files`（未实现但受保护）在无 Cookie 时返回 401
- [ ] 访问 `/api/auth/login` 在无 Cookie 时正常响应（公开路径）
- [ ] 访问 `/`（根页面）未登录时重定向到 `/login`

---

## 与后续步骤的衔接

- 步骤 4 将实现 `(protected)/layout.tsx` 替换 proxy 中的页面重定向逻辑，并添加退出登录功能
- 步骤 4 将在 `lib/auth/session.ts` 中新增 `logout()` 函数（调用 `clearSession()` + 跳转）
