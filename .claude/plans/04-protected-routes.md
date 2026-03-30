# 步骤 4：受保护路由与退出登录

## 背景

步骤 1-3 已完成：Next.js + shadcn/ui + Tailwind 已配置，bcryptjs/jose/nodemailer/zod 已安装，JWT 认证基础设施（password.ts, jwt.ts, session.ts, permissions.ts）、登录 API、登录页面均已实现，`proxy.ts` 已在 Next.js 16 规范下实现了全局 API 权限拦截和页面级未登录重定向。

本步骤目标是：将页面级权限控制从 `proxy.ts` 迁移到 `(protected)/layout.tsx`，实现退出登录功能，并搭建受保护区域的基础页面骨架（首页 + 设置页面），为后续步骤（文件浏览器、Markdown 编辑器）奠定基础。

---

## 依赖安装

无需新增依赖。所有使用的组件均已安装：
- shadcn/ui: `button`, `input`, `card`, `label`, `alert`, `avatar`, `dropdown-menu`, `tooltip`, `sonner`

---

## 新建文件

### 前端

| 文件路径 | 用途 |
|----------|------|
| `src/components/providers/SessionProvider.tsx` | Session Context + `useSession` hook |
| `src/components/layout/Header.tsx` | 顶部导航栏（Logo + 用户菜单 + 退出登录） |
| `src/components/layout/Sidebar.tsx` | 左侧边栏占位（后续步骤 5 扩展） |
| `src/app/(protected)/layout.tsx` | 受保护路由组布局，检查登录状态 |
| `src/app/(protected)/page.tsx` | 首页骨架（Header + Sidebar + 主内容区） |
| `src/app/(protected)/settings/page.tsx` | 设置页面（仅管理员可访问） |

### 后端

| 文件路径 | 用途 |
|----------|------|
| `src/app/api/auth/logout/route.ts` | 退出登录 API（POST） |

---

## 修改文件

| 文件路径 | 修改内容 |
|----------|----------|
| `src/app/page.tsx` | `redirect("/notes")` → `redirect("/")` |
| `src/app/actions/auth.ts` | 新增 `logout()` Server Action |
| `src/proxy.ts` | 移除页面级未登录重定向（第 56-63 行），只保留 API 权限验证 |

---

## 类型定义

无需新增类型。`Session`, `PublicUser`, `User` 类型已在 `src/types/auth.ts` 中定义。

---

## 详细实现

### 1. SessionProvider（新建）

**文件**: `src/components/providers/SessionProvider.tsx`

提供 React Context + `useSession` hook，让子组件访问当前 session。

```typescript
"use client";

import { createContext, useContext } from "react";
import type { Session } from "@/types/auth";

export const SessionContext = createContext<Session | null>(null);

export function SessionProvider({
  session,
  children,
}: {
  session: Session | null;
  children: React.ReactNode;
}) {
  return (
    <SessionContext.Provider value={session}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession(): Session | null {
  return useContext(SessionContext);
}
```

### 2. 受保护布局（新建）

**文件**: `src/app/(protected)/layout.tsx`

检查登录状态，未登录重定向到 `/login`，已登录则用 SessionProvider 注入 session。

```typescript
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { SessionProvider } from "@/components/providers/SessionProvider";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  return <SessionProvider session={session}>{children}</SessionProvider>;
}
```

### 3. Header 组件（新建）

**文件**: `src/components/layout/Header.tsx`

- 左侧：Logo "AI Notebook"
- 右侧：Avatar + 用户名 + 下拉菜单
- 下拉菜单：「个人设置」（禁用占位）、「退出登录」
- 「退出登录」调用 `logout()` Server Action 后跳转 `/login`

依赖组件：`Avatar`, `DropdownMenu`, `Button`（均已安装）。

```typescript
"use client";

import { useRouter } from "next/navigation";
import { logout } from "@/app/actions/auth";
import { useSession } from "@/components/providers/SessionProvider";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Header() {
  const session = useSession();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
    router.refresh();
  };

  const initials = session?.user.username?.slice(0, 2).toUpperCase() ?? "??";

  return (
    <header className="flex h-14 items-center justify-between border-b px-4">
      <span className="font-semibold">AI Notebook</span>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="gap-2">
            <Avatar className="h-7 w-7">
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <span className="hidden text-sm sm:inline">
              {session?.user.username}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem disabled>个人设置</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="text-destructive">
            退出登录
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
```

### 4. Sidebar 占位组件（新建）

**文件**: `src/components/layout/Sidebar.tsx`

左侧边栏，顶部有「新建文件」「新建文件夹」按钮（占位），内容区为占位文字，后续步骤 5 扩展为 FileTree。

```typescript
import { Button } from "@/components/ui/button";
import { FilePlus, FolderPlus } from "lucide-react";

export function Sidebar() {
  return (
    <aside className="flex w-72 flex-col border-r">
      <div className="flex gap-2 border-b p-3">
        <Button variant="outline" size="sm" className="flex-1 gap-1">
          <FilePlus className="h-4 w-4" />
          新建文件
        </Button>
        <Button variant="outline" size="sm" className="flex-1 gap-1">
          <FolderPlus className="h-4 w-4" />
          新建文件夹
        </Button>
      </div>
      <div className="flex-1 overflow-auto p-3">
        <p className="text-sm text-muted-foreground">文件树加载中...</p>
      </div>
    </aside>
  );
}
```

### 5. 首页骨架（新建）

**文件**: `src/app/(protected)/page.tsx`

已登录用户的主页面：Header + Sidebar + 主内容区占位。

```typescript
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";

export default async function HomePage() {
  return (
    <div className="flex h-screen flex-col">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-auto p-6">
          <div className="flex h-full items-center justify-center">
            <p className="text-muted-foreground">
              选择左侧文件开始编辑，或新建一个笔记
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
```

### 6. 设置页面（新建）

**文件**: `src/app/(protected)/settings/page.tsx`

路径 `/settings`，仅管理员可访问。未授权重定向到 `/`。

```typescript
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";

export default async function SettingsPage() {
  const session = await getSession();
  if (session?.user.role !== "admin") redirect("/");

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-bold">系统设置</h1>
      <p className="text-muted-foreground">
        用户管理和系统配置功能（后续步骤实现）
      </p>
    </div>
  );
}
```

### 7. 根页面重定向（修改）

**文件**: `src/app/page.tsx`

将 `redirect("/notes")` 改为 `redirect("/")`。

```typescript
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";

export default async function Home() {
  const session = await getSession();
  if (session) redirect("/");
  redirect("/login");
}
```

### 8. 退出登录 Server Action（修改）

**文件**: `src/app/actions/auth.ts`

新增 `logout()` action。

```typescript
"use server";

import { clearSession } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";

export async function logout(): Promise<void> {
  await clearSession();
  revalidatePath("/", "layout");
}
```

### 9. 退出登录 API（新建）

**文件**: `src/app/api/auth/logout/route.ts`

提供 API 方式退出登录（备用）。

```typescript
import { NextResponse } from "next/server";
import { clearSession } from "@/lib/auth/session";

export async function POST() {
  await clearSession();
  return NextResponse.json({ success: true }, { status: 200 });
}
```

### 10. Proxy 更新（修改）

**文件**: `src/proxy.ts`

移除第 56-63 行的页面级未登录重定向逻辑（由 `(protected)/layout.tsx` 接管），只保留：
1. 公开路径检查
2. `/api/*` JWT 验证

---

## 目录结构（步骤 4 完成后）

```
src/
├── app/
│   ├── page.tsx                           ← 修改
│   ├── (protected)/                       ← 新建
│   │   ├── layout.tsx                     ← 新建
│   │   ├── page.tsx                       ← 新建
│   │   └── settings/
│   │       └── page.tsx                   ← 新建
│   ├── api/
│   │   └── auth/
│   │       ├── login/route.ts             ← 已存在
│   │       └── logout/route.ts           ← 新建
│   └── actions/
│       └── auth.ts                        ← 修改
├── components/
│   ├── providers/
│   │   └── SessionProvider.tsx            ← 新建
│   └── layout/
│       ├── Header.tsx                     ← 新建
│       └── Sidebar.tsx                    ← 新建
└── proxy.ts                               ← 修改
```

---

## 验证清单

- [ ] `pnpm tsc --noEmit` 无 TypeScript 编译错误
- [ ] `pnpm lint` 无 ESLint 错误
- [ ] 访问 `/` 未登录时自动跳转 `/login`
- [ ] 登录后访问 `/` 显示首页骨架（Header + Sidebar + 欢迎文字）
- [ ] 点击「退出登录」清除 Cookie 并跳转 `/login`
- [ ] 访问 `/settings` 未登录自动跳转 `/login`
- [ ] 访问 `/settings` 非管理员自动跳转 `/`
- [ ] `GET /api/files` 无 Cookie 时返回 401（proxy 拦截）
- [ ] `POST /api/auth/logout` 正常返回，Cookie 被清除

---

## 与后续步骤的衔接

- 步骤 5 扩展 `Sidebar.tsx` 为真正的文件浏览器（FileTree 组件），实现 `/[folderId]` 和 `/[folderId]/[nodeId]` 路由
- 步骤 6 在主内容区集成 Plate.js Markdown 编辑器
- 步骤 7 填充 `settings/page.tsx` 的用户管理功能
- 步骤 8 填充 `settings/page.tsx` 的系统配置功能
