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
import type { FileNode } from "@/types/file";
import { loadMetadata } from "@/lib/fs/metadata";

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

    const permissionsJson = formData.get("permissions") as string;
    const permissions = JSON.parse(permissionsJson);

    const rawData = {
      username: formData.get("username") as string,
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      confirmPassword: formData.get("confirmPassword") as string,
      role: formData.get("role") as "admin" | "user",
      permissions,
    };

    // 验证输入
    const parsed = createUserSchema.safeParse(rawData);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "输入验证失败" };
    }

    // 加密密码
    const passwordHash = await bcrypt.hash(parsed.data.password, 10);

    // 创建用户
    createUserInConfig({
      username: parsed.data.username,
      email: parsed.data.email,
      password: "", // 占位，后面会替换
      role: parsed.data.role,
      permissions: parsed.data.permissions,
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

    const permissionsJson = formData.get("permissions") as string;
    const permissions = JSON.parse(permissionsJson);

    const rawData = {
      id: formData.get("id") as string,
      email: formData.get("email") as string,
      role: formData.get("role") as "admin" | "user",
      permissions,
    };

    // 验证输入
    const parsed = updateUserSchema.safeParse(rawData);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "输入验证失败" };
    }

    // 更新用户
    updateUserInConfig(parsed.data.id, {
      email: parsed.data.email,
      role: parsed.data.role,
      permissions: parsed.data.permissions,
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
 * 获取知识库列表
 */
export async function getWorkspaces(): Promise<{ success: boolean; data?: FileNode[]; error?: string }> {
  try {
    await requireAdmin();
    const meta = await loadMetadata();
    const workspaces = meta.root.children?.filter((child) => child.type === "group") ?? [];
    return { success: true, data: workspaces };
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
