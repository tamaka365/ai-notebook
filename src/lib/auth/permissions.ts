import type { PublicUser } from "@/types/auth";

/**
 * 检查用户是否有权限执行操作
 */
export function hasPermission(
  user: PublicUser,
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
  user: PublicUser,
  path: string,
  operation: "read" | "write" | "delete"
): void {
  if (!hasPermission(user, path, operation)) {
    throw new Error("权限不足");
  }
}
