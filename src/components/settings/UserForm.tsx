"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { createUser, updateUser } from "@/app/actions/users";
import { WorkspacePermissionForm } from "./WorkspacePermissionForm";
import type { User, UserPermissions } from "@/types/auth";
import type { FileNode } from "@/types/file";

interface UserFormProps {
  user?: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  availableWorkspaces: FileNode[];
}

const defaultPermissions: UserPermissions = {
  canCreateWorkspace: false,
  workspaces: [],
};

export function UserForm({
  user,
  open,
  onOpenChange,
  onSuccess,
  availableWorkspaces,
}: UserFormProps) {
  const isEdit = !!user;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 表单状态
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "user" as "admin" | "user",
    permissions: defaultPermissions,
  });

  // 当 user 变化时，重置表单
  useEffect(() => {
    if (user) {
      // 兼容性处理：确保 permissions 包含完整的结构
      const permissions = user.permissions?.workspaces
        ? user.permissions
        : defaultPermissions;
      setFormData({
        username: user.username,
        email: user.email,
        password: "",
        confirmPassword: "",
        role: user.role,
        permissions,
      });
    } else {
      setFormData({
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
        role: "user",
        permissions: defaultPermissions,
      });
    }
    setError(null);
  }, [user, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const data = new FormData();

      if (isEdit && user) {
        data.append("id", user.id);
        data.append("email", formData.email);
        data.append("role", formData.role);
        data.append(
          "permissions",
          JSON.stringify(formData.permissions)
        );

        const result = await updateUser(data);
        if (!result.success) {
          setError(result.error ?? "更新失败");
          return;
        }
      } else {
        data.append("username", formData.username);
        data.append("email", formData.email);
        data.append("password", formData.password);
        data.append("confirmPassword", formData.confirmPassword);
        data.append("role", formData.role);
        data.append(
          "permissions",
          JSON.stringify(formData.permissions)
        );

        const result = await createUser(data);
        if (!result.success) {
          setError(result.error ?? "创建失败");
          return;
        }
      }

      onSuccess();
      onOpenChange(false);
    } catch {
      setError("操作失败，请稍后重试");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePermissionsChange = (permissions: UserPermissions) => {
    setFormData((prev) => ({ ...prev, permissions }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "编辑用户" : "新建用户"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "修改用户信息和权限配置" : "创建新用户账号并设置权限"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 用户名 */}
          <div className="space-y-2">
            <Label htmlFor="username">用户名</Label>
            <Input
              id="username"
              value={formData.username}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, username: e.target.value }))
              }
              disabled={isEdit || isLoading}
              placeholder="字母、数字和下划线"
            />
          </div>

          {/* 邮箱 */}
          <div className="space-y-2">
            <Label htmlFor="email">邮箱</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, email: e.target.value }))
              }
              disabled={isLoading}
              placeholder="user@example.com"
            />
          </div>

          {/* 密码（仅新建时显示） */}
          {!isEdit && (
            <>
              <div className="space-y-2">
                <Label htmlFor="password">密码</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, password: e.target.value }))
                  }
                  disabled={isLoading}
                  placeholder="至少 8 位"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">确认密码</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      confirmPassword: e.target.value,
                    }))
                  }
                  disabled={isLoading}
                  placeholder="再次输入密码"
                />
              </div>
            </>
          )}

          {/* 角色 */}
          <div className="space-y-2">
            <Label htmlFor="role">角色</Label>
            <Select
              value={formData.role}
              onValueChange={(value: "admin" | "user") =>
                setFormData((prev) => ({ ...prev, role: value }))
              }
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="选择角色" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">管理员</SelectItem>
                <SelectItem value="user">普通用户</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 权限设置 */}
          <div className="space-y-4 rounded-md border p-4">
            <h4 className="font-medium">权限设置</h4>

            {/* 新建知识库权限 */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="canCreateWorkspace"
                checked={formData.permissions.canCreateWorkspace}
                onCheckedChange={(checked) =>
                  handlePermissionsChange({
                    ...formData.permissions,
                    canCreateWorkspace: checked as boolean,
                  })
                }
                disabled={isLoading}
              />
              <Label
                htmlFor="canCreateWorkspace"
                className="cursor-pointer font-normal"
              >
                允许新建知识库
                <span className="text-muted-foreground ml-2 text-xs">
                  （创建的知识库将自动拥有全部权限）
                </span>
              </Label>
            </div>

            {/* 知识库权限 */}
            <div className="space-y-2">
              <Label>知识库权限</Label>
              <WorkspacePermissionForm
                permissions={formData.permissions.workspaces}
                onChange={(workspaces) =>
                  handlePermissionsChange({
                    ...formData.permissions,
                    workspaces,
                  })
                }
                availableWorkspaces={availableWorkspaces}
              />
            </div>
          </div>

          {/* 错误提示 */}
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              取消
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "保存中..." : isEdit ? "保存修改" : "创建用户"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
