"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { WorkspacePermission } from "@/types/auth";
import type { FileNode } from "@/types/file";

interface WorkspacePermissionFormProps {
  permissions: WorkspacePermission[];
  onChange: (permissions: WorkspacePermission[]) => void;
  availableWorkspaces: FileNode[];
}

export function WorkspacePermissionForm({
  permissions,
  onChange,
  availableWorkspaces,
}: WorkspacePermissionFormProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>("");

  // 获取未授权的知识库列表
  const unAuthorizedWorkspaces = availableWorkspaces.filter(
    (ws) => !permissions.some((p) => p.id === ws.id)
  );

  const handleAdd = () => {
    if (!selectedWorkspaceId) return;

    const workspace = availableWorkspaces.find((ws) => ws.id === selectedWorkspaceId);
    if (!workspace) return;

    const newPermission: WorkspacePermission = {
      id: workspace.id,
      name: workspace.name,
      canRead: true,
      canWrite: false,
    };

    onChange([...permissions, newPermission]);
    setSelectedWorkspaceId("");
    setIsAddDialogOpen(false);
  };

  const handleRemove = (id: string) => {
    onChange(permissions.filter((p) => p.id !== id));
  };

  const handleToggleRead = (id: string) => {
    onChange(
      permissions.map((p) =>
        p.id === id ? { ...p, canRead: !p.canRead } : p
      )
    );
  };

  const handleToggleWrite = (id: string) => {
    onChange(
      permissions.map((p) =>
        p.id === id ? { ...p, canWrite: !p.canWrite } : p
      )
    );
  };

  return (
    <div className="space-y-4">
      {/* 已授权知识库列表 */}
      {permissions.length === 0 ? (
        <div className="text-sm text-muted-foreground">
          暂无知识库权限，请点击下方按钮添加
        </div>
      ) : (
        <div className="space-y-2">
          {permissions.map((permission) => (
            <div
              key={permission.id}
              className="flex items-center justify-between rounded-md border p-3"
            >
              <span className="font-medium">{permission.name}</span>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id={`read-${permission.id}`}
                    checked={permission.canRead}
                    onCheckedChange={() => handleToggleRead(permission.id)}
                  />
                  <Label
                    htmlFor={`read-${permission.id}`}
                    className="cursor-pointer text-sm font-normal"
                  >
                    读取
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id={`write-${permission.id}`}
                    checked={permission.canWrite}
                    onCheckedChange={() => handleToggleWrite(permission.id)}
                  />
                  <Label
                    htmlFor={`write-${permission.id}`}
                    className="cursor-pointer text-sm font-normal"
                  >
                    写入
                  </Label>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => handleRemove(permission.id)}
                >
                  删除
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 添加按钮 */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setIsAddDialogOpen(true)}
        disabled={unAuthorizedWorkspaces.length === 0}
      >
        添加知识库
      </Button>

      {/* 添加知识库对话框 */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>添加知识库</DialogTitle>
            <DialogDescription>
              选择一个知识库并设置权限
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select
              value={selectedWorkspaceId}
              onValueChange={setSelectedWorkspaceId}
            >
              <SelectTrigger>
                <SelectValue placeholder="选择知识库" />
              </SelectTrigger>
              <SelectContent>
                {unAuthorizedWorkspaces.map((ws) => (
                  <SelectItem key={ws.id} value={ws.id}>
                    {ws.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              取消
            </Button>
            <Button type="button" onClick={handleAdd} disabled={!selectedWorkspaceId}>
              添加
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
