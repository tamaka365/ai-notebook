"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";
import {
  getSystemConfig,
  updateSystemConfig as updateSystemConfigInFile,
  validateNotesRootPath,
} from "@/lib/config/manager";
import { updateSystemConfigSchema } from "@/lib/validations/system";
import type { SystemConfig } from "@/types/config";

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
 * 获取系统配置
 */
export async function getSystemConfigAction(): Promise<{
  success: boolean;
  data?: SystemConfig;
  error?: string;
}> {
  try {
    await requireAdmin();
    const config = getSystemConfig();
    return { success: true, data: config };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

/**
 * 更新系统配置
 */
export async function updateSystemConfigAction(
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();

    const rawData = {
      notesRootPath: formData.get("notesRootPath") as string,
    };

    // 验证输入
    const parsed = updateSystemConfigSchema.safeParse(rawData);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "输入验证失败",
      };
    }

    // 验证路径有效性
    const validation = validateNotesRootPath(parsed.data.notesRootPath);
    if (!validation.valid) {
      return {
        success: false,
        error: `路径验证失败: ${validation.error}`,
      };
    }

    // 更新配置
    updateSystemConfigInFile({
      notesRootPath: parsed.data.notesRootPath,
    });

    revalidatePath("/settings");
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

/**
 * 验证笔记根目录路径
 */
export async function validateNotesPathAction(
  path: string
): Promise<{ success: boolean; valid: boolean; error?: string }> {
  try {
    await requireAdmin();
    const result = validateNotesRootPath(path);
    return {
      success: true,
      valid: result.valid,
      error: result.error,
    };
  } catch (error) {
    return {
      success: false,
      valid: false,
      error: (error as Error).message,
    };
  }
}
