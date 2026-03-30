"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { FileTree } from "./FileTree";
import { useFileTree } from "@/hooks/useFileTree";
import { useSession } from "@/components/providers/SessionProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  RefreshCw,
  BookOpen,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { FileNode } from "@/types/file";

export function Sidebar() {
  const session = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const { nodes, loading, error, fetchTree, createNode, deleteNode: deleteNodeApi, renameNode } = useFileTree();
  const [createParentId, setCreateParentId] = useState<string | null>(null);
  const [expandedNodeIds, setExpandedNodeIds] = useState<Record<string, boolean>>({});

  // 从 URL 提取当前选中的笔记 ID（去除尾随斜杠）
  const selectedNoteId = pathname?.startsWith("/notes/")
    ? pathname.replace("/notes/", "").replace(/\/$/, "")
    : null;

  // 同步 URL 状态到展开状态
  useEffect(() => {
    // 只在 nodes 首次加载时初始化展开状态
    if (!selectedNoteId || nodes.length === 0) return;

    const findAndCollect = (nodesList: FileNode[], targetId: string, collectedIds: Record<string, boolean>): boolean => {
      for (const node of nodesList) {
        if (node.id === targetId) {
          return true;
        }
        if (node.children && node.children.length > 0) {
          if (findAndCollect(node.children, targetId, collectedIds)) {
            collectedIds[node.id] = true;
            return true;
          }
        }
      }
      return false;
    };

    setExpandedNodeIds((prev) => {
      // 如果已经有展开状态（用户手动展开过），只合并新的节点
      if (Object.keys(prev).length > 0) {
        const ids = { ...prev };
        findAndCollect(nodes, selectedNoteId, ids);
        return ids;
      }
      // 初次加载，直接设置
      const ids: Record<string, boolean> = {};
      findAndCollect(nodes, selectedNoteId, ids);
      return ids;
    });
  }, [selectedNoteId, nodes]);

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [nodeToDelete, setNodeToDelete] = useState<FileNode | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [renameName, setRenameName] = useState("");
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [renameLoading, setRenameLoading] = useState(false);
  const [renameNodeId, setRenameNodeId] = useState<string | null>(null);
  const [rootId, setRootId] = useState<string | null>(null);

  useEffect(() => {
    fetchTree();
    // 获取根目录 id（用于创建顶级文件夹）
    fetch("/api/notes?info=root").then(async (res) => {
      if (res.ok) {
        const json = await res.json();
        if (json.data?.id) setRootId(json.data.id);
      }
    }).catch(() => {});
  }, [fetchTree]);

  const handleSelect = (node: FileNode) => {
    if (node.type === "doc") {
      router.push(`/notes/${node.id}`);
    }
  };

  const openCreateDialog = () => {
    setCreateName("");
    setCreateDialogOpen(true);
  };

  const handleCreate = async () => {
    if (!createName.trim() || !rootId) return;
    setCreateLoading(true);
    try {
      const parentId = createParentId || rootId;
      await createNode("group", createName.trim(), parentId);
      setCreateDialogOpen(false);
      await fetchTree();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleContextMenu = (node: FileNode) => {
    setNodeToDelete(node);
    setDeleteDialogOpen(true);
  };

  const handleRename = async (node: FileNode) => {
    setRenameNodeId(node.id);
    setRenameName(node.name);
    setRenameDialogOpen(true);
  };

  const handleRenameSubmit = async () => {
    if (!renameName.trim()) return;
    setRenameLoading(true);
    try {
      await renameNode(renameNodeId!, renameName.trim());
      setRenameDialogOpen(false);
      await fetchTree();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setRenameLoading(false);
    }
  };

  const handleCreateFolder = (node: FileNode) => {
    setCreateParentId(node.id);
    setCreateName("");
    setCreateDialogOpen(true);
  };

  const handleCreateNote = async (node: FileNode) => {
    setCreateLoading(true);
    try {
      const newNode = await createNode("doc", "未命名笔记", node.id);
      await fetchTree();
      router.push(`/notes/${newNode.id}`);
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!nodeToDelete) return;
    const isCurrentNote = selectedNoteId === nodeToDelete.id;
    setDeleteLoading(true);
    try {
      await deleteNodeApi(nodeToDelete.id);
      setDeleteDialogOpen(false);
      setNodeToDelete(null);
      await fetchTree();
      // 如果删除的是当前选中的笔记，重定向到 /notes
      if (isCurrentNote) {
        router.push("/notes");
      }
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleToggleExpand = useCallback((nodeId: string) => {
    setExpandedNodeIds((prev) => {
      const next: Record<string, boolean> = { ...prev };
      if (next[nodeId]) {
        delete next[nodeId];
      } else {
        next[nodeId] = true;
      }
      return next;
    });
  }, []);

  return (
    <aside className="flex w-72 flex-col border-r">
      <div className="flex items-center gap-1 border-b p-3">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 gap-1"
          onClick={() => openCreateDialog()}
        >
          <BookOpen className="h-4 w-4" />
          新建知识库
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => fetchTree()}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-3 select-none">
        {loading && nodes.length === 0 ? (
          <div className="space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-5 w-1/2" />
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : (
          <FileTree
            nodes={nodes}
            selectedNoteId={selectedNoteId ?? undefined}
            expandedNodeIds={expandedNodeIds}
            onSelect={handleSelect}
            onContextMenu={handleContextMenu}
            onRename={handleRename}
            onDelete={(node) => {
              setNodeToDelete(node);
              setDeleteDialogOpen(true);
            }}
            onCreateFolder={handleCreateFolder}
            onCreateNote={handleCreateNote}
            onToggleExpand={handleToggleExpand}
          />
        )}
      </div>

      {/* 删除确认对话框 */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="确认删除"
        description={
          nodeToDelete && (
            <>
              确认删除「{nodeToDelete.name}」？
            </>
          )
        }
        confirmText="删除"
        cancelText="取消"
        onConfirm={handleDelete}
        loading={deleteLoading}
        variant="destructive"
      />

      {/* 重命名对话框 */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>重命名</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <Input
              placeholder="名称"
              value={renameName}
              onChange={(e) => setRenameName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleRenameSubmit()}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleRenameSubmit} disabled={!renameName.trim() || renameLoading}>
              {renameLoading ? "重命名中..." : "重命名"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="border-t p-3 text-xs text-muted-foreground">
        <span>{session?.user.username}</span>
        <span className="mx-1">·</span>
        <span>{session?.user.role === "admin" ? "管理员" : "用户"}</span>
      </div>

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{createParentId ? "新建分类" : "新建知识库"}</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <Input
              placeholder={createParentId ? "分类名称" : "知识库名称"}
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleCreate} disabled={!createName.trim() || createLoading}>
              {createLoading ? "创建中..." : "创建"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </aside>
  );
}
