import type { PublicUser } from "@/types/auth";

/**
 * 检查用户是否有权限执行操作
 * @param workspaceId 知识库ID
 */
export function hasPermission(
  user: PublicUser,
  workspaceId: string,
  operation: "read" | "write" | "delete"
): boolean {
  // 禁用用户拒绝
  if (user.status === "disabled") return false;

  // 管理员通过
  if (user.role === "admin") return true;

  // 查找知识库权限
  const workspacePerm = user.permissions.workspaces.find(
    (w) => w.id === workspaceId
  );

  if (!workspacePerm) return false;

  if (operation === "read") {
    return workspacePerm.canRead;
  }

  // write 和 delete 都需要 write 权限
  if (operation === "write" || operation === "delete") {
    return workspacePerm.canWrite;
  }

  return false;
}

/**
 * 检查用户是否可以创建知识库
 */
export function canCreateWorkspace(user: PublicUser): boolean {
  if (user.status === "disabled") return false;
  if (user.role === "admin") return true;
  return user.permissions.canCreateWorkspace;
}

/**
 * 权限不足时抛出错误
 */
export function checkPermission(
  user: PublicUser,
  workspaceId: string,
  operation: "read" | "write" | "delete"
): void {
  if (!hasPermission(user, workspaceId, operation)) {
    throw new Error("权限不足");
  }
}
