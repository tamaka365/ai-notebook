# 步骤 5：文件浏览器（侧边栏与文件树）

## 描述

实现左侧边栏的文件目录树，支持查看笔记目录结构、新建文件和文件夹。

---

## 上下文

当前项目已完成初始化、认证系统（JWT）、登录/重置密码页面。本步骤需要实现文件浏览器功能——左侧边栏目录树和对应的后端 API 路由，连接前端界面和笔记文件系统（笔记根目录 `./notes`）。

**已有资产（直接复用）：**

| 文件 | 说明 |
|------|------|
| `src/types/file.ts` | 已有 `FileNode`、`FileContent` 接口 |
| `src/types/api.ts` | 已有 `ApiResponse<T>` 通用响应格式 |
| `src/lib/auth/permissions.ts` | 已有 `hasPermission`、`checkPermission` 函数 |
| `src/lib/auth/session.ts` | 已有 `getSession()` 可获取当前会话 |
| `src/lib/config/manager.ts` | 已有 `getConfig()` 获取笔记根目录 |
| `src/components/layout/Sidebar.tsx` | 已占位，仅需填充逻辑 |
| `src/components/providers/SessionProvider.tsx` | 已实现，客户端可获取 session |
| `src/app/(protected)/layout.tsx` | 已实现路由保护 |

---

## 一、需要安装的依赖

**无需安装任何新依赖。** `fs`（Node.js 内置）和 `path`（Node.js 内置）足够实现所有文件系统操作。

---

## 二、需要创建的文件清单

### 2.1 工具库（2 个文件）

#### `src/lib/fs/notes.ts` — 文件系统工具

**职责：** 封装所有对笔记文件系统的读写操作，基于 `config.json` 中的 `system.notesRootPath`。

**需要实现的函数：**

| 函数 | 签名 | 说明 |
|------|------|------|
| `getNotesRoot` | `() => string` | 读取 `config.json` 的 `notesRootPath`，转为绝对路径 |
| `normalizePath` | `(relative: string) => string` | 拼接 `notesRootPath` + 相对路径，拒绝路径穿越 |
| `readDir` | `(relativePath?: string) => FileNode[]` | 读取目录，返回 `FileNode[]`，递归生成唯一 id |
| `readFile` | `(relativePath: string) => FileContent` | 读取文件内容和元数据 |
| `writeFile` | `(relativePath: string, content: string) => FileNode` | 创建/覆盖文件，返回元数据 |
| `createDir` | `(relativePath: string) => FileNode` | 创建文件夹，返回元数据 |
| `deletePath` | `(relativePath: string) => void` | 删除文件或递归删除文件夹 |
| `renamePath` | `(oldPath: string, newName: string) => FileNode` | 重命名，返回新元数据 |

**关键实现细节：**

- `id` 使用 `crypto.randomUUID()` 生成，保证唯一性
- `normalizePath` 必须拒绝路径穿越攻击（`relativePath` 包含 `..` 时抛出错误）
- 空文件夹保留 `.gitkeep` 文件
- 所有路径使用 `path.resolve` 跨平台兼容

```typescript
// 核心结构
import fs from "fs/promises";
import path from "path";
import { getConfig } from "@/lib/config/manager";
import type { FileNode, FileContent } from "@/types/file";

export function getNotesRoot(): string {
  const config = getConfig();
  return path.resolve(process.cwd(), config.system.notesRootPath);
}

export function normalizePath(relative: string): string {
  const root = getNotesRoot();
  const resolved = path.resolve(root, relative);
  if (!resolved.startsWith(root)) throw new Error("禁止访问目录外资源");
  return resolved;
}

export async function readDir(relativePath?: string): Promise<FileNode[]> {
  const dirPath = relativePath ? normalizePath(relativePath) : getNotesRoot();
  await fs.mkdir(dirPath, { recursive: true }); // 自动创建根目录
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  const nodes: FileNode[] = [];

  for (const entry of entries) {
    const entryPath = relativePath ? `${relativePath}/${entry.name}` : entry.name;
    const fullPath = path.join(dirPath, entry.name);
    const stat = await fs.stat(fullPath);
    const node: FileNode = {
      id: crypto.randomUUID(),
      name: entry.name,
      path: entryPath,
      type: entry.isDirectory() ? "folder" : "file",
      createdAt: stat.birthtime.toISOString(),
      updatedAt: stat.mtime.toISOString(),
    };
    if (entry.isFile()) node.size = stat.size;
    if (entry.isDirectory()) {
      node.children = await readDir(entryPath); // 递归
    }
    nodes.push(node);
  }

  // 文件夹优先，然后按名称排序
  return nodes.sort((a, b) => {
    if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

export async function readFile(relativePath: string): Promise<FileContent> {
  const fullPath = normalizePath(relativePath);
  const stat = await fs.stat(fullPath);
  const content = await fs.readFile(fullPath, "utf-8");
  const node: FileNode = {
    id: crypto.randomUUID(),
    name: path.basename(relativePath),
    path: relativePath,
    type: "file",
    createdAt: stat.birthtime.toISOString(),
    updatedAt: stat.mtime.toISOString(),
    size: stat.size,
  };
  return { content, metadata: node };
}

export async function writeFile(relativePath: string, content: string): Promise<FileNode> {
  const fullPath = normalizePath(relativePath);
  await fs.mkdir(path.dirname(fullPath), { recursive: true });
  await fs.writeFile(fullPath, content, "utf-8");
  const stat = await fs.stat(fullPath);
  return {
    id: crypto.randomUUID(),
    name: path.basename(relativePath),
    path: relativePath,
    type: "file",
    createdAt: stat.birthtime.toISOString(),
    updatedAt: stat.mtime.toISOString(),
    size: stat.size,
  };
}

export async function createDir(relativePath: string): Promise<FileNode> {
  const fullPath = normalizePath(relativePath);
  await fs.mkdir(fullPath, { recursive: true });
  // 在空目录中创建 .gitkeep
  const gitkeepPath = path.join(fullPath, ".gitkeep");
  await fs.writeFile(gitkeepPath, "", "utf-8");
  const stat = await fs.stat(fullPath);
  return {
    id: crypto.randomUUID(),
    name: path.basename(relativePath),
    path: relativePath,
    type: "folder",
    createdAt: stat.birthtime.toISOString(),
    updatedAt: stat.mtime.toISOString(),
  };
}

export async function deletePath(relativePath: string): Promise<void> {
  const fullPath = normalizePath(relativePath);
  const stat = await fs.stat(fullPath);
  if (stat.isDirectory()) {
    await fs.rm(fullPath, { recursive: true });
  } else {
    await fs.unlink(fullPath);
  }
}

export async function renamePath(oldPath: string, newName: string): Promise<FileNode> {
  const root = getNotesRoot();
  const oldFullPath = normalizePath(oldPath);
  const newFullPath = path.resolve(root, path.dirname(oldPath), newName);
  if (!newFullPath.startsWith(root)) throw new Error("禁止访问目录外资源");
  await fs.rename(oldFullPath, newFullPath);
  const newRelPath = path.join(path.dirname(oldPath), newName).replace(/\\/g, "/");
  const stat = await fs.stat(newFullPath);
  return {
    id: crypto.randomUUID(),
    name: newName,
    path: newRelPath,
    type: stat.isDirectory() ? "folder" : "file",
    createdAt: stat.birthtime.toISOString(),
    updatedAt: stat.mtime.toISOString(),
    size: stat.isFile() ? stat.size : undefined,
  };
}
```

#### `src/lib/api-response.ts` — 统一 API 响应构造器

```typescript
import { NextResponse } from "next/server";
import type { ApiResponse } from "@/types/api";

export function ok<T>(data: T, status = 200) {
  return NextResponse.json<ApiResponse<T>>({ success: true, data }, { status });
}

export function fail(code: string, message: string, status = 400) {
  return NextResponse.json<ApiResponse>(
    { success: false, error: { code, message } },
    { status }
  );
}

export const unauthorized = () => fail("UNAUTHORIZED", "未授权", 401);
export const forbidden = () => fail("FORBIDDEN", "权限不足", 403);
export const notFound = () => fail("NOT_FOUND", "文件不存在", 404);
export const serverError = () => fail("SERVER_ERROR", "服务器错误", 500);
```

### 2.2 API 路由（2 个文件）

#### `src/app/api/files/route.ts` — GET 列表 / POST 创建

```typescript
// GET /api/files?path=xxx   → 返回 FileNode[]
// POST /api/files           → body: { path, type, content? }
// 权限：需登录（已通过 middleware.ts 保护）
```

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { checkPermission } from "@/lib/auth/permissions";
import { readDir, writeFile, createDir } from "@/lib/fs/notes";
import { ok, fail, unauthorized, forbidden, serverError } from "@/lib/api-response";
import type { ApiResponse } from "@/types/api";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return unauthorized();

    const { searchParams } = request.nextUrl;
    const relativePath = searchParams.get("path") ?? undefined;

    try {
      checkPermission(session.user, relativePath ?? "", "read");
    } catch {
      return forbidden();
    }

    const nodes = await readDir(relativePath);
    return ok(nodes);
  } catch (error) {
    console.error("读取文件列表失败:", error);
    return serverError();
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return unauthorized();

    const body = await request.json();
    const { path: relativePath, type, content = "" } = body;

    if (!relativePath || !type) {
      return fail("INVALID_INPUT", "path 和 type 不能为空", 400);
    }

    if (type !== "file" && type !== "folder") {
      return fail("INVALID_INPUT", "type 必须是 file 或 folder", 400);
    }

    try {
      checkPermission(session.user, relativePath, type === "folder" ? "write" : "write");
    } catch {
      return forbidden();
    }

    let result;
    if (type === "folder") {
      result = await createDir(relativePath);
    } else {
      result = await writeFile(relativePath, content ?? "");
    }

    return ok(result, 201);
  } catch (error) {
    console.error("创建文件/文件夹失败:", error);
    return serverError();
  }
}
```

#### `src/app/api/files/[...path]/route.ts` — GET / PUT / DELETE

```typescript
// GET /api/files/a/b.md     → 返回 FileContent
// PUT /api/files/a/b.md     → body: { content }
// DELETE /api/files/a/b.md  → 返回 { success: true }
```

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { checkPermission } from "@/lib/auth/permissions";
import { readFile, writeFile, deletePath } from "@/lib/fs/notes";
import { ok, fail, unauthorized, forbidden, notFound, serverError } from "@/lib/api-response";

type Params = { params: Promise<{ path: string[] }> };

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const session = await getSession();
    if (!session) return unauthorized();

    const { path: segments } = await params;
    const relativePath = segments.join("/");

    try {
      checkPermission(session.user, relativePath, "read");
    } catch {
      return forbidden();
    }

    const content = await readFile(relativePath);
    return ok(content);
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "禁止访问目录外资源") return forbidden();
    if (error instanceof Error && (error.message.includes("ENOENT") || error.message.includes("no such file"))) return notFound();
    console.error("读取文件失败:", error);
    return serverError();
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const session = await getSession();
    if (!session) return unauthorized();

    const { path: segments } = await params;
    const relativePath = segments.join("/");

    try {
      checkPermission(session.user, relativePath, "write");
    } catch {
      return forbidden();
    }

    const body = await request.json();
    const { content } = body;

    if (content === undefined) {
      return fail("INVALID_INPUT", "content 不能为空", 400);
    }

    await writeFile(relativePath, content);
    return ok({ success: true });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "禁止访问目录外资源") return forbidden();
    if (error instanceof Error && (error.message.includes("ENOENT") || error.message.includes("no such file"))) return notFound();
    console.error("更新文件失败:", error);
    return serverError();
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const session = await getSession();
    if (!session) return unauthorized();

    const { path: segments } = await params;
    const relativePath = segments.join("/");

    try {
      checkPermission(session.user, relativePath, "delete");
    } catch {
      return forbidden();
    }

    await deletePath(relativePath);
    return ok({ success: true });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "禁止访问目录外资源") return forbidden();
    if (error instanceof Error && (error.message.includes("ENOENT") || error.message.includes("no such file"))) return notFound();
    console.error("删除失败:", error);
    return serverError();
  }
}
```

**注意：** `GET /api/files`（根路径）的请求，`params.path` 会是空数组 `[]`，此时 `join("/")` 返回空字符串，传入 `readDir(undefined)` 读取根目录。

### 2.3 客户端 Hook（1 个文件）

#### `src/hooks/useFileTree.ts` — 文件树数据 hook

```typescript
"use client";

import { useState, useCallback } from "react";
import type { FileNode } from "@/types/file";

export function useFileTree() {
  const [nodes, setNodes] = useState<FileNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTree = useCallback(async (path?: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = path ? `?path=${encodeURIComponent(path)}` : "";
      const res = await fetch(`/api/files${params}`);
      const json = await res.json();
      if (json.success) {
        setNodes(json.data as FileNode[]);
      } else {
        setError(json.error.message);
      }
    } catch {
      setError("加载文件列表失败");
    } finally {
      setLoading(false);
    }
  }, []);

  const createNode = useCallback(async (
    type: "file" | "folder",
    name: string,
    parentPath?: string
  ) => {
    const nodePath = parentPath ? `${parentPath}/${name}` : name;
    const res = await fetch("/api/files", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, path: nodePath, content: type === "file" ? "" : undefined }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error.message);
    return json.data as FileNode;
  }, []);

  const deleteNode = useCallback(async (path: string) => {
    const res = await fetch(`/api/files/${encodeURIComponent(path)}`, {
      method: "DELETE",
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error.message);
  }, []);

  return { nodes, loading, error, fetchTree, createNode, deleteNode };
}
```

### 2.4 组件（2 个文件）

#### `src/components/layout/FileTree.tsx` — 递归文件树

**功能：**
- 接收 `nodes: FileNode[]` 和 `onSelect` 回调
- 文件夹：可展开/折叠，带 Folder/FolderOpen 图标；点击目录名称也触发展开
- 文件：带 FileText 图标，点击触发 `onSelect`
- 选中状态高亮（使用 `bg-accent` 背景色）
- 递归渲染子节点
- 空状态显示提示文字

```typescript
"use client";

import { useState } from "react";
import { ChevronRight, ChevronDown, Folder, FolderOpen, FileText } from "lucide-react";
import type { FileNode } from "@/types/file";

interface FileTreeProps {
  nodes: FileNode[];
  selectedPath?: string;
  onSelect: (node: FileNode) => void;
  depth?: number;
}

export function FileTree({ nodes, selectedPath, onSelect, depth = 0 }: FileTreeProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggleExpand = (node: FileNode) => {
    setExpanded((prev) => ({ ...prev, [node.path]: !prev[node.path] }));
  };

  if (nodes.length === 0) {
    return (
      <p className="py-2 text-xs text-muted-foreground">
        {depth === 0 ? "暂无文件" : ""}
      </p>
    );
  }

  return (
    <ul className="space-y-0.5">
      {nodes.map((node) => {
        const isFolder = node.type === "folder";
        const isExpanded = expanded[node.path];
        const isSelected = selectedPath === node.path;
        const hasChildren = isFolder && node.children && node.children.length > 0;

        return (
          <li key={node.id}>
            <div
              className={`group flex items-center gap-1 rounded-sm px-2 py-1 text-sm cursor-pointer transition-colors ${
                isSelected ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"
              }`}
              style={{ paddingLeft: `${depth * 16 + 8}px` }}
              onClick={() => {
                if (isFolder) toggleExpand(node);
                onSelect(node);
              }}
            >
              {/* 展开/折叠图标 */}
              <span className="w-4 flex-shrink-0">
                {isFolder && hasChildren && (
                  isExpanded ? (
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                  )
                )}
              </span>

              {/* 文件/文件夹图标 */}
              {isFolder ? (
                isExpanded ? (
                  <FolderOpen className="h-4 w-4 flex-shrink-0 text-amber-500" />
                ) : (
                  <Folder className="h-4 w-4 flex-shrink-0 text-amber-500" />
                )
              ) : (
                <FileText className="h-4 w-4 flex-shrink-0 text-blue-500" />
              )}

              {/* 名称 */}
              <span className="truncate">{node.name}</span>
            </div>

            {/* 递归子节点 */}
            {isFolder && isExpanded && node.children && (
              <FileTree
                nodes={node.children}
                selectedPath={selectedPath}
                onSelect={onSelect}
                depth={depth + 1}
              />
            )}
          </li>
        );
      })}
    </ul>
  );
}
```

#### `src/components/layout/Sidebar.tsx` — 重写侧边栏

**替换现有占位代码**，完整实现：

```typescript
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FileTree } from "./FileTree";
import { useFileTree } from "@/hooks/useFileTree";
import { useSession } from "@/components/providers/SessionProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  FilePlus,
  FolderPlus,
  RefreshCw,
  MoreVertical,
  Trash2,
  Pencil,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { FileNode } from "@/types/file";

export function Sidebar() {
  const session = useSession();
  const router = useRouter();
  const { nodes, loading, error, fetchTree, createNode, deleteNode } = useFileTree();
  const [selectedPath, setSelectedPath] = useState<string>();

  // 新建对话框
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createType, setCreateType] = useState<"file" | "folder">("file");
  const [createName, setCreateName] = useState("");
  const [createLoading, setCreateLoading] = useState(false);

  // 右键菜单
  const [contextMenuNode, setContextMenuNode] = useState<FileNode | null>(null);
  const [contextMenuOpen, setContextMenuOpen] = useState(false);

  // 初始加载
  useEffect(() => {
    fetchTree();
  }, [fetchTree]);

  // 选中文件节点：跳转到对应笔记页面
  const handleSelect = (node: FileNode) => {
    if (node.type === "file") {
      setSelectedPath(node.path);
      // 导航到笔记页面（后续步骤接入编辑器）
      router.push(`/notes/${encodeURIComponent(node.path)}`);
    }
  };

  // 打开新建对话框
  const openCreateDialog = (type: "file" | "folder") => {
    setCreateType(type);
    setCreateName("");
    setCreateDialogOpen(true);
  };

  // 确认新建
  const handleCreate = async () => {
    if (!createName.trim()) return;
    setCreateLoading(true);
    try {
      await createNode(createType, createName.trim());
      setCreateDialogOpen(false);
      await fetchTree();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setCreateLoading(false);
    }
  };

  // 删除节点
  const handleDelete = async (node: FileNode) => {
    if (!confirm(`确认删除 ${node.name}？${node.type === "folder" ? "（包含所有子文件）" : ""}`)) return;
    try {
      await deleteNode(node.path);
      setContextMenuOpen(false);
      await fetchTree();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  return (
    <aside className="flex w-72 flex-col border-r">
      {/* 顶部操作栏 */}
      <div className="flex items-center gap-1 border-b p-3">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 gap-1"
          onClick={() => openCreateDialog("file")}
        >
          <FilePlus className="h-4 w-4" />
          新建文件
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1 gap-1"
          onClick={() => openCreateDialog("folder")}
        >
          <FolderPlus className="h-4 w-4" />
          新建文件夹
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

      {/* 文件树 */}
      <div className="flex-1 overflow-auto p-3">
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
            selectedPath={selectedPath}
            onSelect={handleSelect}
          />
        )}
      </div>

      {/* 底部用户信息 */}
      <div className="border-t p-3 text-xs text-muted-foreground">
        <span>{session?.user.username}</span>
        <span className="mx-1">·</span>
        <span>{session?.user.role === "admin" ? "管理员" : "用户"}</span>
      </div>

      {/* 新建对话框 */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              新建{createType === "folder" ? "文件夹" : "文件"}
            </DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <Input
              placeholder={createType === "folder" ? "文件夹名称" : "文件名称（如 notes.md）"}
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
```

---

## 三、需要修改的现有文件

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/components/layout/Sidebar.tsx` | **重写** | 替换占位代码为完整实现 |
| `src/lib/fs/notes.ts` | **新建** | 覆盖空文件，实现文件系统工具 |
| `src/lib/api-response.ts` | **新建** | 统一 API 响应构造器 |
| `src/hooks/useFileTree.ts` | **新建** | 客户端文件树数据 hook |
| `src/app/api/files/route.ts` | **新建** | GET 列表 + POST 创建 |
| `src/app/api/files/[...path]/route.ts` | **新建** | GET/PUT/DELETE 单个文件 |

---

## 四、需要创建的目录

```bash
mkdir -p src/app/api/files
mkdir -p "src/app/api/files/[...path]"
mkdir -p src/lib/fs
mkdir -p src/hooks
```

---

## 五、验证清单

### 5.1 类型检查
```bash
pnpm tsc --noEmit
```
预期：无 TypeScript 编译错误。

### 5.2 ESLint 检查
```bash
pnpm lint
```
预期：无 ESLint 错误。

### 5.3 手动功能验证（启动 `pnpm dev` 后）

1. 登录系统后访问首页 `/`，侧边栏应显示笔记目录树（如 `notes/` 不存在应自动创建）
2. 点击「新建文件」→ 输入 `hello.md` → 确认文件出现在列表中
3. 点击「新建文件夹」→ 输入 `test-folder` → 确认文件夹出现且可展开
4. 在 `test-folder` 下新建文件 `note.md`
5. 点击文件 `hello.md` → 应跳转至 `/notes/hello.md`（笔记页面后续步骤实现）
6. 刷新页面 → 文件树应保持最新状态
7. 右键文件 → 删除 → 确认从列表移除

### 5.4 API 路由直接验证

```bash
# 获取文件列表
curl -b "ai_notebook_token=<token>" http://localhost:3000/api/files

# 创建文件
curl -X POST \
  -H "Content-Type: application/json" \
  -b "ai_notebook_token=<token>" \
  -d '{"type":"file","path":"test.md","content":"# Hello"}' \
  http://localhost:3000/api/files

# 读取文件
curl -b "ai_notebook_token=<token>" http://localhost:3000/api/files/test.md

# 更新文件
curl -X PUT \
  -H "Content-Type: application/json" \
  -b "ai_notebook_token=<token>" \
  -d '{"content":"# Updated"}' \
  http://localhost:3000/api/files/test.md

# 删除文件
curl -X DELETE -b "ai_notebook_token=<token>" http://localhost:3000/api/files/test.md

# 创建文件夹
curl -X POST \
  -H "Content-Type: application/json" \
  -b "ai_notebook_token=<token>" \
  -d '{"type":"folder","path":"my-folder"}' \
  http://localhost:3000/api/files
```

预期：所有接口返回 `{ success: true, data: ... }` 格式。

---

## 六、实现顺序

1. `src/lib/fs/notes.ts` — 底层文件系统工具
2. `src/lib/api-response.ts` — API 响应辅助函数
3. `src/app/api/files/route.ts` — GET 列表 + POST 创建
4. `src/app/api/files/[...path]/route.ts` — GET/PUT/DELETE 单文件
5. `src/hooks/useFileTree.ts` — 客户端数据层 hook
6. `src/components/layout/FileTree.tsx` — 递归文件树组件
7. `src/components/layout/Sidebar.tsx` — 完整侧边栏实现
8. 验证：tsc → lint → 手动功能测试
