# 步骤 7：用户管理

## 背景

步骤 1-6 已完成：项目初始化、重置密码、登录功能、受保护布局、文件系统、编辑器均已实现。

本步骤目标是实现完整的用户管理功能，包括：用户 CRUD、权限配置、状态管理。仅管理员可访问 `/settings` 页面，进行用户的创建、编辑、删除、启用/禁用操作。

---

## 前端

### 1.1 用户列表组件

**文件**: `src/components/settings/UserList.tsx`（新建）

**功能**:
- 展示所有用户的表格（用户名、邮箱、角色、状态、创建时间）
- 「新建用户」按钮打开用户表单对话框
- 每行用户的「编辑」和「删除」按钮
- 支持启用/禁用用户状态的切换
- 使用 shadcn/ui 组件：`Table`, `Button`, `Badge`, `Dialog`, `DropdownMenu`

**表格列**:
| 列名 | 说明 |
|------|------|
| 用户名 | user.username |
| 邮箱 | user.email |
| 角色 | Badge 显示（管理员/普通用户）|
| 状态 | Badge 显示（启用/禁用）|
| 目录权限 | 显示可访问目录，`*` 表示全部 |
| 操作权限 | 显示 read/write/delete/admin |
| 操作 | 编辑/删除按钮 |

**状态**:
- `users: User[]` - 用户列表数据
- `isLoading: boolean` - 加载状态
- `selectedUser: User | null` - 当前选中的用户（用于编辑）
- `isFormOpen: boolean` - 表单对话框开关
- `isDeleteDialogOpen: boolean` - 删除确认对话框开关

**样式**:
- 使用 `Card` 包裹表格
- 操作列固定在右侧
- 暗黑模式兼容

### 1.2 用户表单组件（新增/编辑）

**文件**: `src/components/settings/UserForm.tsx`（新建）

**功能**:
- 新增用户时：填写用户名、邮箱、密码、角色、目录权限、操作权限
- 编辑用户时：可修改邮箱、角色、目录权限、操作权限（用户名不可修改）
- 表单验证使用 zod schema
- 提交时调用对应 Server Action

**表单字段**:
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| username | text | 是（仅新增）| 用户名，唯一标识 |
| email | email | 是 | 邮箱地址 |
| password | password | 是（仅新增）| 至少 8 位 |
| confirmPassword | password | 是（仅新增）| 确认密码 |
| role | select | 是 | admin / user |
| directories | text | 是 | 可访问目录，逗号分隔，`*` 表示全部 |
| operations | checkbox | 是 | read / write / delete / admin |

**组件 Props**:
```typescript
interface UserFormProps {
  user?: User | null; // null 表示新增
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void; // 提交成功后回调，刷新用户列表
}
```

**使用的 shadcn/ui 组件**:
- `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`
- `Form`, `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormMessage`
- `Input`, `Select`, `Checkbox`, `Button`

### 1.3 删除用户确认对话框

**文件**: `src/components/settings/DeleteUserDialog.tsx`（新建）

**功能**:
- 确认删除用户前的二次确认
- 显示被删除用户的用户名
- 「取消」和「确认删除」按钮

**组件 Props**:
```typescript
interface DeleteUserDialogProps {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}
```

### 1.4 设置页面（修改现有）

**文件**: `src/app/(protected)/settings/page.tsx`（修改现有）

**功能**:
- 保留管理员权限检查
- 导入并渲染 `<UserList />` 组件
- 添加「用户管理」标题和描述

```tsx
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getConfig } from "@/lib/config/manager";
import { UserList } from "@/components/settings/UserList";

export default async function SettingsPage() {
  const session = await getSession();
  if (session?.user.role !== "admin") redirect("/");

  const config = getConfig();

  return (
    <div className="p-6">
      <h1 className="mb-2 text-2xl font-bold">系统设置</h1>
      <p className="text-muted-foreground mb-6">管理用户账号和权限配置</p>
      <UserList initialUsers={config.users} />
    </div>
  );
}
```

---

## 后端

### 2.1 用户管理验证 Schema

**文件**: `src/lib/validations/user.ts`（新建）

```typescript
import { z } from "zod";

// 创建用户
export const createUserSchema = z.object({
  username: z
    .string()
    .min(1, "请输入用户名")
    .regex(/^[a-zA-Z0-9_]+$/, "用户名只能包含字母、数字和下划线"),
  email: z
    .string()
    .min(1, "请输入邮箱地址")
    .email("请输入有效的邮箱地址"),
  password: z
    .string()
    .min(8, "密码至少 8 位"),
  confirmPassword: z.string(),
  role: z.enum(["admin", "user"]),
  directories: z.string().min(1, "请输入目录权限"),
  operations: z.array(z.enum(["read", "write", "delete", "admin"])),
}).refine((data) => data.password === data.confirmPassword, {
  message: "两次输入的密码不一致",
  path: ["confirmPassword"],
});

// 更新用户
export const updateUserSchema = z.object({
  id: z.string(),
  email: z
    .string()
    .min(1, "请输入邮箱地址")
    .email("请输入有效的邮箱地址"),
  role: z.enum(["admin", "user"]),
  directories: z.string().min(1, "请输入目录权限"),
  operations: z.array(z.enum(["read", "write", "delete", "admin"])),
});

// 切换用户状态
export const toggleUserStatusSchema = z.object({
  id: z.string(),
  status: z.enum(["active", "disabled"]),
});

// 删除用户
export const deleteUserSchema = z.object({
  id: z.string(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type ToggleUserStatusInput = z.infer<typeof toggleUserStatusSchema>;
export type DeleteUserInput = z.infer<typeof deleteUserSchema>;
```

### 2.2 Config Manager 扩展

**文件**: `src/lib/config/manager.ts`（修改现有）

新增以下函数：

```typescript
/**
 * 获取所有用户列表
 */
export function getUsers(): User[] {
  const config = readConfig();
  return config.users;
}

/**
 * 创建用户
 */
export function createUser(userData: Omit<User, "id" | "createdAt" | "updatedAt" | "passwordHash"> & { password: string }): User {
  const config = readConfig();

  // 检查用户名是否已存在
  if (config.users.some((u) => u.username === userData.username)) {
    throw new Error("用户名已存在");
  }

  // 检查邮箱是否已存在
  if (config.users.some((u) => u.email === userData.email)) {
    throw new Error("邮箱已被注册");
  }

  const now = new Date().toISOString();
  const newUser: User = {
    id: crypto.randomUUID(),
    username: userData.username,
    email: userData.email,
    passwordHash: "", // 由调用方使用 bcrypt 加密后设置
    role: userData.role,
    status: "active",
    permissions: userData.permissions,
    createdAt: now,
    updatedAt: now,
  };

  config.users.push(newUser);
  writeConfig(config);

  return newUser;
}

/**
 * 更新用户信息
 */
export function updateUser(
  id: string,
  data: Partial<Pick<User, "email" | "role" | "status" | "permissions">>
): User {
  const config = readConfig();
  const userIndex = config.users.findIndex((u) => u.id === id);

  if (userIndex === -1) {
    throw new Error("用户不存在");
  }

  const user = config.users[userIndex]!;

  // 如果修改邮箱，检查是否与其他用户冲突
  if (data.email && data.email !== user.email) {
    if (config.users.some((u) => u.id !== id && u.email === data.email)) {
      throw new Error("邮箱已被其他用户使用");
    }
  }

  config.users[userIndex] = {
    ...user,
    ...data,
    updatedAt: new Date().toISOString(),
  };

  writeConfig(config);

  return config.users[userIndex]!;
}

/**
 * 删除用户
 */
export function deleteUser(id: string): void {
  const config = readConfig();

  // 防止删除最后一个管理员
  const user = config.users.find((u) => u.id === id);
  if (user?.role === "admin") {
    const adminCount = config.users.filter((u) => u.role === "admin").length;
    if (adminCount <= 1) {
      throw new Error("不能删除最后一个管理员");
    }
  }

  config.users = config.users.filter((u) => u.id !== id);
  writeConfig(config);
}

/**
 * 更新用户密码
 */
export function updateUserPassword(id: string, passwordHash: string): void {
  const config = readConfig();
  const userIndex = config.users.findIndex((u) => u.id === id);

  if (userIndex === -1) {
    throw new Error("用户不存在");
  }

  config.users[userIndex]!.passwordHash = passwordHash;
  config.users[userIndex]!.updatedAt = new Date().toISOString();

  writeConfig(config);
}
```

### 2.3 用户管理 Server Actions

**文件**: `src/app/actions/users.ts`（新建）

```typescript
"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";
import {
  getUsers,
  createUser as createUserInConfig,
  updateUser as updateUserInConfig,
  deleteUser as deleteUserInConfig,
  updateUserPassword,
} from "@/lib/config/manager";
import {
  createUserSchema,
  updateUserSchema,
  toggleUserStatusSchema,
  deleteUserSchema,
} from "@/lib/validations/user";
import type { User } from "@/types/auth";

/**
 * 检查当前用户是否为管理员
 */
async function requireAdmin(): Promise<void> {
  const session = await getSession();
  if (!session || session.user.role !== "admin") {
    throw new Error("权限不足，需要管理员权限");
  }
}

/**
 * 获取用户列表
 */
export async function getUserList(): Promise<{ success: boolean; data?: User[]; error?: string }> {
  try {
    await requireAdmin();
    const users = getUsers();
    return { success: true, data: users };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

/**
 * 创建用户
 */
export async function createUser(formData: FormData): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();

    const rawData = {
      username: formData.get("username") as string,
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      confirmPassword: formData.get("confirmPassword") as string,
      role: formData.get("role") as "admin" | "user",
      directories: formData.get("directories") as string,
      operations: (formData.getAll("operations") as string[]) as ("read" | "write" | "delete" | "admin")[],
    };

    // 验证输入
    const parsed = createUserSchema.safeParse(rawData);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "输入验证失败" };
    }

    // 加密密码
    const passwordHash = await bcrypt.hash(parsed.data.password, 10);

    // 解析目录权限
    const directories = parsed.data.directories.split(",").map((d) => d.trim()).filter(Boolean);

    // 创建用户
    createUserInConfig({
      username: parsed.data.username,
      email: parsed.data.email,
      password: "", // 占位，后面会替换
      role: parsed.data.role,
      permissions: {
        directories: directories.length > 0 ? directories : ["*"],
        operations: parsed.data.operations,
      },
    });

    // 更新密码哈希（createUserInConfig 未直接支持设置密码）
    const users = getUsers();
    const newUser = users.find((u) => u.username === parsed.data.username);
    if (newUser) {
      updateUserPassword(newUser.id, passwordHash);
    }

    revalidatePath("/settings");
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

/**
 * 更新用户
 */
export async function updateUser(formData: FormData): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();

    const rawData = {
      id: formData.get("id") as string,
      email: formData.get("email") as string,
      role: formData.get("role") as "admin" | "user",
      directories: formData.get("directories") as string,
      operations: (formData.getAll("operations") as string[]) as ("read" | "write" | "delete" | "admin")[],
    };

    // 验证输入
    const parsed = updateUserSchema.safeParse(rawData);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "输入验证失败" };
    }

    // 解析目录权限
    const directories = parsed.data.directories.split(",").map((d) => d.trim()).filter(Boolean);

    // 更新用户
    updateUserInConfig(parsed.data.id, {
      email: parsed.data.email,
      role: parsed.data.role,
      permissions: {
        directories: directories.length > 0 ? directories : ["*"],
        operations: parsed.data.operations,
      },
    });

    revalidatePath("/settings");
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

/**
 * 切换用户状态（启用/禁用）
 */
export async function toggleUserStatus(
  id: string,
  status: "active" | "disabled"
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();

    // 验证输入
    const parsed = toggleUserStatusSchema.safeParse({ id, status });
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "输入验证失败" };
    }

    // 不能禁用自己
    const session = await getSession();
    if (session?.user.id === id && status === "disabled") {
      return { success: false, error: "不能禁用当前登录的账号" };
    }

    updateUserInConfig(id, { status });

    revalidatePath("/settings");
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

/**
 * 删除用户
 */
export async function deleteUser(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();

    // 验证输入
    const parsed = deleteUserSchema.safeParse({ id });
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "输入验证失败" };
    }

    // 不能删除自己
    const session = await getSession();
    if (session?.user.id === id) {
      return { success: false, error: "不能删除当前登录的账号" };
    }

    deleteUserInConfig(id);

    revalidatePath("/settings");
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}
```

---

## 类型定义

### 3.1 API 类型扩展

**文件**: `src/types/api.ts`（修改现有）

新增用户管理相关类型：

```typescript
// 用户列表响应
export interface UserListResponse {
  users: {
    id: string;
    username: string;
    email: string;
    role: string;
    status: string;
    permissions: {
      directories: string[];
      operations: string[];
    };
    createdAt: string;
    updatedAt: string;
  }[];
}

// 创建用户请求
export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  role: "admin" | "user";
  directories: string;
  operations: ("read" | "write" | "delete" | "admin")[];
}

// 更新用户请求
export interface UpdateUserRequest {
  id: string;
  email: string;
  role: "admin" | "user";
  directories: string;
  operations: ("read" | "write" | "delete" | "admin")[];
}
```

---

## 文件清单

### 新建文件

| 文件路径 | 用途 |
|----------|------|
| `src/lib/validations/user.ts` | 用户管理表单验证 schema |
| `src/app/actions/users.ts` | 用户管理 Server Actions |
| `src/components/settings/UserList.tsx` | 用户列表组件（表格展示 + 操作） |
| `src/components/settings/UserForm.tsx` | 用户表单组件（新增/编辑） |
| `src/components/settings/DeleteUserDialog.tsx` | 删除用户确认对话框 |

### 修改文件

| 文件路径 | 修改内容 |
|----------|----------|
| `src/lib/config/manager.ts` | 新增 `getUsers`, `createUser`, `updateUser`, `deleteUser`, `updateUserPassword` 函数 |
| `src/types/api.ts` | 新增用户管理相关 API 类型 |
| `src/app/(protected)/settings/page.tsx` | 替换占位内容，渲染 UserList 组件 |

### 目录结构（步骤 7 完成后）

```
src/
├── app/
│   ├── (protected)/
│   │   └── settings/
│   │       └── page.tsx              ← 修改：渲染 UserList
│   └── actions/
│       ├── auth.ts                   ← 已存在
│       └── users.ts                  ← 新建
├── components/
│   └── settings/
│       ├── UserList.tsx              ← 新建
│       ├── UserForm.tsx              ← 新建
│       └── DeleteUserDialog.tsx      ← 新建
├── lib/
│   ├── auth/
│   │   ├── jwt.ts                    ← 已存在
│   │   ├── password.ts               ← 已存在
│   │   ├── session.ts                ← 已存在
│   │   └── permissions.ts            ← 已存在
│   ├── config/
│   │   └── manager.ts                ← 修改：新增用户管理函数
│   └── validations/
│       ├── auth.ts                   ← 已存在
│       └── user.ts                   ← 新建
└── types/
    ├── auth.ts                       ← 已存在
    ├── api.ts                        ← 修改：新增类型
    └── config.ts                     ← 已存在
```

---

## 验证清单

- [ ] `pnpm tsc --noEmit` 无 TypeScript 编译错误
- [ ] `pnpm lint` 无 ESLint 错误
- [ ] 只有管理员能访问 `/settings`
- [ ] 普通用户访问 `/settings` 被重定向到 `/`
- [ ] 用户列表正确显示所有用户信息
- [ ] 能正常新建用户（密码 bcrypt 加密存储）
- [ ] 新建用户时用户名/邮箱重复有错误提示
- [ ] 能正常编辑用户信息（用户名不可修改）
- [ ] 能正常启用/禁用用户状态
- [ ] 不能禁用/删除当前登录的账号
- [ ] 不能删除最后一个管理员
- [ ] 删除用户有二次确认对话框
- [ ] 操作成功后页面自动刷新

---

## 与后续步骤的衔接

- 步骤 8 将实现系统配置（修改笔记根目录路径）功能，可在本设置页面添加「系统配置」标签页
- 用户权限配置完成后，文件系统 API 将根据用户权限过滤可访问的目录
