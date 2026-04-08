import { z } from "zod";

// 知识库权限 schema
const workspacePermissionSchema = z.object({
  id: z.string(),
  name: z.string(),
  canRead: z.boolean(),
  canWrite: z.boolean(),
});

// 用户权限 schema
const userPermissionsSchema = z.object({
  canCreateWorkspace: z.boolean(),
  workspaces: z.array(workspacePermissionSchema),
});

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
  permissions: userPermissionsSchema,
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
  permissions: userPermissionsSchema,
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
