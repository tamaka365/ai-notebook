"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UserForm } from "./UserForm";
import { DeleteUserDialog } from "./DeleteUserDialog";
import { deleteUser, toggleUserStatus } from "@/app/actions/users";
import { useSession } from "@/components/providers/SessionProvider";
import type { User } from "@/types/auth";
import type { FileNode } from "@/types/file";

interface UserListProps {
  initialUsers: User[];
  availableWorkspaces: FileNode[];
}

export function UserList({ initialUsers, availableWorkspaces }: UserListProps) {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const currentUser = useSession()?.user;

  // 判断是否可以禁用用户（不能禁用自己）
  const canDisableUser = (user: User) => user.id !== currentUser?.id;

  // 判断是否可以删除用户（不能删除自己，不能删除最后一个管理员）
  const canDeleteUser = (user: User) => {
    if (user.id === currentUser?.id) return false;
    if (user.role === "admin") {
      const adminCount = users.filter((u) => u.role === "admin").length;
      if (adminCount <= 1) return false;
    }
    return true;
  };

  const handleAddUser = () => {
    setSelectedUser(null);
    setIsFormOpen(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (user: User) => {
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedUser) return;

    const result = await deleteUser(selectedUser.id);
    if (result.success) {
      setUsers((prev) => prev.filter((u) => u.id !== selectedUser.id));
      setIsDeleteDialogOpen(false);
      setSelectedUser(null);
    } else {
      alert(result.error || "删除失败");
    }
  };

  const handleToggleStatus = async (user: User) => {
    const newStatus = user.status === "active" ? "disabled" : "active";
    const result = await toggleUserStatus(user.id, newStatus);

    if (result.success) {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id ? { ...u, status: newStatus } : u
        )
      );
    } else {
      alert(result.error || "操作失败");
    }
  };

  const handleSuccess = () => {
    // 重新获取用户列表
    window.location.reload();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getRoleBadge = (role: string) => {
    if (role === "admin") {
      return <Badge variant="default">管理员</Badge>;
    }
    return <Badge variant="secondary">普通用户</Badge>;
  };

  const getStatusBadge = (status: string) => {
    if (status === "active") {
      return <Badge variant="default">启用</Badge>;
    }
    return <Badge variant="destructive">禁用</Badge>;
  };

  // 格式化权限显示
  const formatPermissions = (user: User) => {
    // 安全检查：处理旧数据格式
    if (!user.permissions?.workspaces) {
      return "无特殊权限（旧数据格式）";
    }

    const parts: string[] = [];

    if (user.permissions.canCreateWorkspace) {
      parts.push("可新建知识库");
    }

    const workspaceCount = user.permissions.workspaces.length;
    if (workspaceCount > 0) {
      const readCount = user.permissions.workspaces.filter(w => w.canRead).length;
      const writeCount = user.permissions.workspaces.filter(w => w.canWrite).length;
      parts.push(`${workspaceCount}个知识库(读:${readCount}/写:${writeCount})`);
    }

    if (parts.length === 0) {
      return "无特殊权限";
    }

    return parts.join("，");
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>用户列表</CardTitle>
          <Button onClick={handleAddUser}>新建用户</Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>用户名</TableHead>
                <TableHead>邮箱</TableHead>
                <TableHead>角色</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>权限概览</TableHead>
                <TableHead>创建时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    暂无用户数据
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.username}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell>{getStatusBadge(user.status)}</TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {formatPermissions(user)}
                      </span>
                    </TableCell>
                    <TableCell>{formatDate(user.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={!canDisableUser(user)}
                          title={!canDisableUser(user) ? "不能禁用当前登录账号" : ""}
                          onClick={() => handleToggleStatus(user)}
                        >
                          {user.status === "active" ? "禁用" : "启用"}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditUser(user)}
                        >
                          编辑
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={!canDeleteUser(user)}
                          title={
                            user.id === currentUser?.id
                              ? "不能删除当前登录账号"
                              : user.role === "admin" && users.filter((u) => u.role === "admin").length <= 1
                                ? "不能删除最后一个管理员"
                                : ""
                          }
                          onClick={() => handleDeleteClick(user)}
                        >
                          删除
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <UserForm
        user={selectedUser}
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSuccess={handleSuccess}
        availableWorkspaces={availableWorkspaces}
      />

      <DeleteUserDialog
        user={selectedUser}
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
}
