# 步骤 6：Markdown 编辑器

## 描述

实现笔记内容的阅读和编辑功能，基于 Plate.js 富文本编辑器，支持 Markdown 语法和实时预览。

---

## 依赖安装

### 6.1 安装 Plate.js 核心依赖

```bash
pnpm add @udecode/plate-ui @udecode/plate-common
```

| 包 | 版本 | 用途 |
|----|------|------|
| `@udecode/plate-ui` | latest | Plate.js UI 组件（工具栏、编辑器等） |
| `@udecode/plate-common` | latest | Plate.js 核心公共库 |

### 6.2 安装 Plate.js 插件包

```bash
pnpm add @udecode/plate-basic-marks   # 加粗、斜体、下划线等基础格式
pnpm add @udecode/plate-blockquote   # 引用块
pnpm add @udecode/plate-heading       # 标题（H1-H6）
pnpm add @udecode/plate-list          # 有序/无序列表
pnpm add @udecode/plate-link          # 链接
pnpm add @udecode/plate-code-block    # 代码块
pnpm add @udecode/plate-code          # 行内代码
pnpm add @udecode/plate-horizontal-rule  # 分割线
pnpm add @udecode/plate-line-height   # 行高
pnpm add @udecode/plate-mention       # @提及
pnpm add @udecode/plate-table          # 表格
pnpm add @udecode/plate-toggle         # 可折叠内容
pnpm add @udecode/plate-alignment     # 文本对齐
pnpm add @udecode/plate-indent        # 缩进
pnpm add @udecode/plate-color         # 文本颜色/背景色
pnpm add @udecode/plate-font          # 字体
pnpm add @udecode/plate-highlight     # 高亮
pnpm add @udecode/plate-search         # 搜索替换
pnpm add @udecode/plate-media          # 图片/媒体
pnpm add @udecode/plate-juice          # 将 HTML 粘贴为纯文本
```

### 6.3 安装 Plate.js styled 组件包（自动样式主题）

```bash
pnpm add @udecode/plate-styled-components  # styled-components 主题
pnpm add styled-components                 # CSS-in-JS 库
pnpm add -D @types/styled-components
```

### 6.4 安装 Markdown 相关依赖

```bash
pnpm add @udecode/plate-markdown    # Markdown 序列化/反序列化
pnpm add remark-parse                # Markdown 解析
pnpm add remark-stringify            # Markdown 生成
pnpm add unified                     # 处理流水线
pnpm add -D @types/styled-components # styled-components 类型
```

---

## 类型定义

### 6.5 创建 `src/types/editor.ts`

编辑器相关类型定义。

```typescript
// 编辑器状态
export interface EditorState {
  content: string;        // Markdown 原文
  lastSaved: number | null;  // 上次保存时间戳
  isDirty: boolean;       // 是否有未保存更改
  isSaving: boolean;      // 是否正在保存
}

// 笔记详情
export interface NoteDetail {
  content: string;        // 文件内容（Markdown）
  metadata: {
    id: string;
    name: string;
    path: string;
    type: "file";
    createdAt: string;
    updatedAt: string;
    size?: number;
  };
}

// 笔记列表项
export interface NoteItem {
  id: string;
  name: string;
  path: string;
  type: "file" | "folder";
  createdAt: string;
  updatedAt: string;
  size?: number;
}

// 搜索结果
export interface SearchResult {
  path: string;
  name: string;
  preview: string;  // 匹配上下文片段
  matchCount: number;
}

// 快捷键命令
export interface EditorCommand {
  id: string;
  label: string;
  icon?: string;
  shortcut?: string;
  action: () => void;
}
```

---

## 工具函数

### 6.6 创建 `src/lib/editor/plugins.ts`

Plate.js 插件配置。

```typescript
import { createBasicElementsPlugin } from "@udecode/plate-basic-elements";
import { createBasicMarksPlugin } from "@udecode/plate-basic-marks";
import { createBlockquotePlugin } from "@udecode/plate-blockquote";
import { createHeadingPlugin } from "@udecode/plate-heading";
import { createListPlugin } from "@udecode/plate-list";
import { createLinkPlugin } from "@udecode/plate-link";
import { createCodeBlockPlugin } from "@udecode/plate-code-block";
import { createHorizontalRulePlugin } from "@udecode/plate-horizontal-rule";
import { createIndentPlugin } from "@udecode/plate-indent";
import { createAlignmentPlugin } from "@udecode/plate-alignment";
import { createFontPlugin } from "@udecode/plate-font";
import { createColorPlugin } from "@udecode/plate-color";
import { createHighlightPlugin } from "@udecode/plate-highlight";
import { createTablePlugin } from "@udecode/plate-table";
import { createSearchPlugin } from "@udecode/plate-search";
import { createTogglePlugin } from "@udecode/plate-toggle";
import { createMarkdownPlugin } from "@udecode/plate-markdown";

/**
 * 获取所有编辑器插件
 */
export function getEditorPlugins() {
  return [
    createMarkdownPlugin(),
    createBasicElementsPlugin(),
    createBasicMarksPlugin(),
    createBlockquotePlugin(),
    createHeadingPlugin(),
    createListPlugin(),
    createLinkPlugin(),
    createCodeBlockPlugin(),
    createHorizontalRulePlugin(),
    createIndentPlugin(),
    createAlignmentPlugin(),
    createFontPlugin(),
    createColorPlugin(),
    createHighlightPlugin(),
    createTablePlugin(),
    createSearchPlugin(),
    createTogglePlugin(),
  ];
}
```

---

## Hooks

### 6.7 创建 `src/hooks/useNoteEditor.ts`

笔记编辑器状态管理 Hook。

```typescript
"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { NoteDetail } from "@/types/editor";

interface UseNoteEditorOptions {
  path: string;           // 当前文件路径
  initialContent?: string; // 初始内容
  autoSaveDelay?: number; // 自动保存延迟（毫秒），默认 2000
}

interface UseNoteEditorReturn {
  content: string;          // 当前 Markdown 内容
  setContent: (content: string) => void;
  isDirty: boolean;         // 是否有未保存更改
  isSaving: boolean;        // 是否正在保存
  lastSaved: Date | null;   // 上次保存时间
  error: string | null;     // 错误信息
  save: () => Promise<void>;    // 手动保存
  loadNote: (path: string) => Promise<void>;  // 加载笔记
  wordCount: number;        // 字数统计
}

export function useNoteEditor(options: UseNoteEditorOptions): UseNoteEditorReturn;
```

实现要点：
- 内部使用 `useRef` 存储防抖定时器
- `save` 函数调用 `PUT /api/files/${encodeURIComponent(path)}`
- `loadNote` 函数调用 `GET /api/files/${encodeURIComponent(path)}`
- `wordCount` 通过统计 content 字符串的字数/字符数获得

### 6.8 创建 `src/hooks/useAutoSave.ts`

自动保存 Hook。

```typescript
"use client";

import { useEffect, useRef, useCallback } from "react";

interface UseAutoSaveOptions {
  content: string;
  isDirty: boolean;
  onSave: () => Promise<void>;
  delay?: number;  // 防抖延迟
  enabled?: boolean;
}

export function useAutoSave({
  content,
  isDirty,
  onSave,
  delay = 2000,
  enabled = true,
}: UseAutoSaveOptions): void;
```

### 6.9 创建 `src/hooks/useEditorKeyboardShortcuts.ts`

编辑器快捷键 Hook。

```typescript
"use client";

import { useEffect } from "react";
import type { PlateEditor } from "@udecode/plate";

interface ShortcutConfig {
  bold?: string;      // 默认 "mod+b"
  italic?: string;    // 默认 "mod+i"
  underline?: string; // 默认 "mod+u"
  code?: string;      // 默认 "mod+e"
  save?: string;      // 默认 "mod+s"
}

export function useEditorKeyboardShortcuts(
  editor: PlateEditor,
  callbacks: {
    onSave?: () => void;
    onBold?: () => void;
    onItalic?: () => void;
  },
  shortcuts?: ShortcutConfig
): void;
```

---

## 组件

### 6.10 创建 `src/components/ui/toolbar.tsx`

Toolbar UI 组件（基于 Radix UI）。

```bash
pnpm add @radix-ui/react-toolbar
```

```typescript
// src/components/ui/toolbar.tsx
import * as React from "react";
import * as ToolbarPrimitive from "@radix-ui/react-toolbar";
import { cn } from "@/lib/utils";

const Toolbar = ToolbarPrimitive.Root;
const ToolbarToggleGroup = ToolbarPrimitive.ToggleGroup;
const ToolbarToggleItem = ToolbarPrimitive.ToggleItem;
const ToolbarGroup = ToolbarPrimitive.Group;
const ToolbarButton = ToolbarPrimitive.Button;
const ToolbarDivider = ToolbarPrimitive.Separator;

export { Toolbar, ToolbarToggleGroup, ToolbarToggleItem, ToolbarGroup, ToolbarButton, ToolbarDivider };
```

### 6.11 创建 `src/components/editor/EditorToolbar.tsx`

富文本编辑器工具栏组件。

**功能**：
- 加粗、斜体、下划线、删除线
- 标题（H1-H6）
- 有序列表、无序列表、任务列表
- 引用块、代码块、行内代码
- 链接、图片
- 文本对齐（居左、居中、居右、两端）
- 缩进（增加/减少）
- 分割线
- 搜索替换
- 撤销/重做
- 字数统计显示

**技术要求**：
- 使用 `src/components/ui/toolbar.tsx` 的 Toolbar 组件
- 使用 shadcn/ui `DropdownMenu` 实现折叠分组
- 使用 shadcn/ui `Toggle` 实现格式切换状态
- 使用 Plate.js store 获取编辑器状态
- 支持移动端折叠工具栏

### 6.12 创建 `src/components/editor/PlateEditor.tsx`

Plate.js 富文本编辑器入口组件（服务端组件，用于动态导入）。

```typescript
// src/components/editor/PlateEditor.tsx
"use client";

import dynamic from "next/dynamic";
import { Plate, PlateContent } from "@udecode/plate";
import { getEditorPlugins } from "@/lib/editor/plugins";
import { useNoteEditor } from "@/hooks/useNoteEditor";
import { EditorToolbar } from "./EditorToolbar";
import { PlateEditorError } from "./EditorError";
import { PlateEditorSkeleton } from "./EditorSkeleton";

// 禁用 SSR（Plate.js 使用浏览器 API）
export const PlateEditorClient = dynamic(
  () => import("./PlateEditorClient"),
  { ssr: false, loading: () => <PlateEditorSkeleton /> }
);

export function PlateEditor({
  path,
  initialContent = "",
  readOnly = false,
}: {
  path: string;
  initialContent?: string;
  readOnly?: boolean;
}) {
  return <PlateEditorClient path={path} initialContent={initialContent} readOnly={readOnly} />;
}
```

### 6.13 创建 `src/components/editor/PlateEditorClient.tsx`

Plate.js 编辑器客户端实现（SSR 禁用后使用）。

```typescript
// src/components/editor/PlateEditorClient.tsx
"use client";

import { useCallback, useMemo } from "react";
import { Plate, PlateContent } from "@udecode/plate";
import { createMarkdownPlugin } from "@udecode/plate-markdown";
import { getEditorPlugins } from "@/lib/editor/plugins";
import { useNoteEditor } from "@/hooks/useNoteEditor";
import { EditorToolbar } from "./EditorToolbar";
import { cn } from "@/lib/utils";

export function PlateEditorClient({
  path,
  initialContent,
  readOnly = false,
}: {
  path: string;
  initialContent?: string;
  readOnly?: boolean;
}) {
  const {
    content,
    setContent,
    isDirty,
    isSaving,
    lastSaved,
    save,
    wordCount,
    error,
  } = useNoteEditor({ path, initialContent });

  const plugins = useMemo(() => getEditorPlugins(), []);

  const initialValue = useMemo(() => {
    if (initialContent) {
      // 尝试解析 Markdown 为 Plate.js 值
      // fallback 使用简单的段落节点
      return initialContent;
    }
    return [{ type: "p", children: [{ text: "" }] }];
  }, [initialContent]);

  const handleValueChange = useCallback(
    (newValue: any) => {
      if (!readOnly) {
        setContent(newValue);
      }
    },
    [readOnly, setContent]
  );

  return (
    <div className="flex flex-col h-full">
      {!readOnly && <EditorToolbar />}
      <div className="flex-1 overflow-auto">
        <Plate
          id={path}
          plugins={plugins}
          initialValue={initialValue}
          onChange={handleValueChange}
          editableProps={{ readOnly }}
        >
          <PlateContent
            placeholder="开始写作..."
            className="prose prose-neutral dark:prose-invert max-w-none min-h-[500px]"
          />
        </Plate>
      </div>
      <div className="border-t px-4 py-2 flex items-center justify-between text-xs text-muted-foreground">
        <span>{wordCount} 字</span>
        {isSaving && <span>保存中...</span>}
        {isDirty && !isSaving && <span className="text-yellow-500">有未保存的更改</span>}
        {!isDirty && lastSaved && (
          <span>已保存于 {lastSaved.toLocaleTimeString()}</span>
        )}
        {error && <span className="text-red-500">{error}</span>}
      </div>
    </div>
  );
}
```

### 6.14 创建 `src/components/editor/PlateEditorSkeleton.tsx`

编辑器加载骨架屏。

```typescript
// src/components/editor/PlateEditorSkeleton.tsx
"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function PlateEditorSkeleton() {
  return (
    <div className="flex flex-col h-full">
      {/* 工具栏骨架 */}
      <div className="border-b p-2 flex gap-2">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="w-8 h-8" />
        ))}
      </div>
      {/* 内容骨架 */}
      <div className="flex-1 p-4 space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton
            key={i}
            className="h-4"
            style={{ width: `${60 + Math.random() * 40}%` }}
          />
        ))}
      </div>
    </div>
  );
}
```

### 6.15 创建 `src/components/editor/EditorError.tsx`

编辑器错误状态组件。

```typescript
// src/components/editor/EditorError.tsx
"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface EditorErrorProps {
  error: string;
  onRetry?: () => void;
}

export function EditorError({ error, onRetry }: EditorErrorProps) {
  return (
    <Alert variant="destructive">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>加载失败</AlertTitle>
      <AlertDescription className="flex items-center justify-between">
        <span>{error}</span>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            <RefreshCw className="w-4 h-4 mr-2" />
            重试
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}
```

### 6.16 创建 `src/components/editor/NoteHeader.tsx`

笔记顶部信息栏（显示笔记名称、路径、创建/更新时间）。

```typescript
// src/components/editor/NoteHeader.tsx
"use client";

import { FileText, Calendar, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface NoteHeaderProps {
  name: string;
  path: string;
  createdAt: string;
  updatedAt: string;
  isDirty: boolean;
  isSaving: boolean;
}

export function NoteHeader({
  name,
  path,
  createdAt,
  updatedAt,
  isDirty,
  isSaving,
}: NoteHeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/30">
      <div className="flex items-center gap-3 min-w-0">
        <FileText className="w-4 h-4 shrink-0 text-muted-foreground" />
        <span className="font-medium truncate">{name}</span>
        {isDirty && <Badge variant="secondary" className="text-xs">有更改</Badge>}
        {isSaving && <Badge variant="default" className="text-xs">保存中...</Badge>}
      </div>
      <div className="flex items-center gap-4 text-xs text-muted-foreground shrink-0">
        <span className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          创建: {new Date(createdAt).toLocaleDateString()}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          更新: {new Date(updatedAt).toLocaleDateString()}
        </span>
      </div>
    </div>
  );
}
```

---

## 页面路由

### 6.17 创建 `src/app/(protected)/notes/[...path]/page.tsx`

笔记详情页（编辑器主页面）。

**路由**：
- `/notes/{encodedPath}` - 打开指定笔记
- 例如：`/notes/documents/my-note.md`

**布局**：
```
┌─────────────────────────────────────────┐
│  笔记头部（名称、状态、时间）              │
├─────────────────────────────────────────┤
│  工具栏（格式按钮组）                     │
├─────────────────────────────────────────┤
│                                         │
│  编辑区域（Plate.js）                    │
│                                         │
│                                         │
└─────────────────────────────────────────┘
```

**实现**：

```typescript
// src/app/(protected)/notes/[...path]/page.tsx
import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth/jwt";
import { getNoteContent } from "@/lib/fs/notes";
import { checkPermission } from "@/lib/auth/permissions";
import { NoteEditorPage } from "./NoteEditorPage";

interface PageProps {
  params: Promise<{ path: string[] }>;
}

export default async function NotePage({ params }: PageProps) {
  const { path: pathSegments } = await params;
  const filePath = pathSegments.join("/");

  // 验证会话
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  const session = token ? await verifyToken(token) : null;

  if (!session) {
    redirect("/login");
  }

  // 加载笔记内容
  const result = await getNoteContent(filePath);

  if (!result) {
    notFound();
  }

  // 权限检查
  const canWrite = checkPermission(session.user, filePath, "write");
  if (!canWrite) {
    // 无写权限但有读权限，进入只读模式
    return (
      <NoteEditorPage
        initialContent={result.content}
        metadata={result.metadata}
        readOnly={true}
      />
    );
  }

  return (
    <NoteEditorPage
      initialContent={result.content}
      metadata={result.metadata}
      readOnly={false}
    />
  );
}
```

### 6.18 创建 `src/app/(protected)/notes/[...path]/NoteEditorPage.tsx`

笔记编辑页面客户端组件。

```typescript
// src/app/(protected)/notes/[...path]/NoteEditorPage.tsx
"use client";

import { PlateEditor } from "@/components/editor/PlateEditor";
import { NoteHeader } from "@/components/editor/NoteHeader";
import { EditorError } from "@/components/editor/EditorError";
import type { NoteDetail } from "@/types/editor";

interface NoteEditorPageProps {
  initialContent: string;
  metadata: NoteDetail["metadata"];
  readOnly?: boolean;
}

export function NoteEditorPage({
  initialContent,
  metadata,
  readOnly = false,
}: NoteEditorPageProps) {
  return (
    <div className="flex flex-col h-full">
      <NoteHeader
        name={metadata.name}
        path={metadata.path}
        createdAt={metadata.createdAt}
        updatedAt={metadata.updatedAt}
        isDirty={false}
        isSaving={false}
      />
      <PlateEditor
        path={metadata.path}
        initialContent={initialContent}
        readOnly={readOnly}
      />
    </div>
  );
}
```

### 6.19 更新 `src/app/(protected)/page.tsx`

首页如果还没有文件树展示，需要实现：
- 显示欢迎信息
- 提供"创建第一个笔记"的入口
- 或直接展示最近编辑的笔记列表

---

## API/后端

### 6.20 更新 `src/app/api/files/[...path]/route.ts`

确保支持 GET（读取笔记内容）和 PUT（保存笔记内容）。

**GET** - 读取笔记内容：

```typescript
export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: pathSegments } = await params;
  const filePath = pathSegments.join("/");

  // 验证会话和权限
  const result = await getNoteContent(filePath);

  if (!result) {
    return Response.json(
      { success: false, error: { code: "NOT_FOUND", message: "文件不存在" } },
      { status: 404 }
    );
  }

  return Response.json({ success: true, data: result });
}
```

**PUT** - 保存笔记内容：

```typescript
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: pathSegments } = await params;
  const filePath = pathSegments.join("/");

  // 验证会话和权限（在 middleware 层或这里验证）
  const body = await request.json();
  const { content } = body;

  await updateNoteContent(filePath, content);

  return Response.json({ success: true });
}
```

### 6.21 创建/更新 `src/lib/fs/notes.ts`

笔记文件操作工具函数。

```typescript
import { promises as fs } from "fs";
import path from "path";
import { loadConfig } from "@/lib/config/manager";
import type { FileContent } from "@/types/file";

/**
 * 读取笔记内容（GET /api/files/[...path]）
 */
export async function getNoteContent(notePath: string): Promise<FileContent | null> {
  const config = await loadConfig();
  const notesRoot = config.system.notesRootPath;
  const fullPath = path.join(notesRoot, notePath);

  try {
    const [content, stat] = await Promise.all([
      fs.readFile(fullPath, "utf-8"),
      fs.stat(fullPath),
    ]);

    return {
      content,
      metadata: {
        id: notePath,
        name: path.basename(notePath),
        path: notePath,
        type: "file",
        createdAt: stat.birthtime.toISOString(),
        updatedAt: stat.mtime.toISOString(),
        size: stat.size,
      },
    };
  } catch {
    return null;
  }
}

/**
 * 更新笔记内容（PUT /api/files/[...path]）
 */
export async function updateNoteContent(
  notePath: string,
  content: string
): Promise<void> {
  const config = await loadConfig();
  const notesRoot = config.system.notesRootPath;
  const fullPath = path.join(notesRoot, notePath);

  await fs.writeFile(fullPath, content, "utf-8");
}
```

---

## 配置

### 6.22 添加 shadcn/ui 组件

如果以下组件还未安装，需要添加：

```bash
pnpm shadcn add button input dialog dropdown-menu separator badge alert skeleton tooltip label toggle toggle-group scroll-area
```

### 6.23 配置 Plate.js 样式

在 `src/app/globals.css` 中添加 Plate.js 编辑器基础样式。

---

## 现有文件更新

### 6.24 更新 `src/app/(protected)/layout.tsx`

确保全局布局包含必要的 Provider。

```typescript
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <SessionProvider session={session}>
      <TooltipProvider>
        {children}
        <Toaster />
      </TooltipProvider>
    </SessionProvider>
  );
}
```

### 6.25 更新 `src/components/layout/sidebar.tsx`

确保点击文件时跳转到正确的笔记页面：

```typescript
// 更新 handleSelect 函数中的跳转路径
const handleSelect = (node: FileNode) => {
  if (node.type === "file") {
    // 跳转到笔记编辑页面
    router.push(`/notes/${encodeURIComponent(node.path)}`);
  }
};
```

---

## 文件清单

### 新建文件

| 文件路径 | 用途 |
|---------|------|
| `src/types/editor.ts` | 编辑器相关类型定义 |
| `src/lib/editor/plugins.ts` | Plate.js 插件配置 |
| `src/hooks/useNoteEditor.ts` | 笔记编辑器状态 Hook |
| `src/hooks/useAutoSave.ts` | 自动保存 Hook |
| `src/hooks/useEditorKeyboardShortcuts.ts` | 编辑器快捷键 Hook |
| `src/components/ui/toolbar.tsx` | Toolbar UI 组件 |
| `src/components/editor/EditorToolbar.tsx` | 工具栏组件 |
| `src/components/editor/PlateEditor.tsx` | 编辑器入口组件 |
| `src/components/editor/PlateEditorClient.tsx` | 编辑器客户端实现 |
| `src/components/editor/PlateEditorSkeleton.tsx` | 加载骨架屏 |
| `src/components/editor/EditorError.tsx` | 错误状态 |
| `src/components/editor/NoteHeader.tsx` | 笔记头部信息栏 |
| `src/app/(protected)/notes/[...path]/page.tsx` | 笔记详情页（服务端） |
| `src/app/(protected)/notes/[...path]/NoteEditorPage.tsx` | 笔记详情页（客户端） |

### 需要更新的文件

| 文件路径 | 更新内容 |
|---------|---------|
| `src/app/(protected)/layout.tsx` | 添加 TooltipProvider 和 Toaster |
| `src/components/layout/sidebar.tsx` | 确认跳转到 `/notes/{path}` |
| `src/app/globals.css` | 添加 Plate.js 样式 |
| `src/lib/fs/notes.ts` | 添加/确认 `getNoteContent` 和 `updateNoteContent` |
| `src/app/api/files/[...path]/route.ts` | 确认支持 GET/PUT |

---

## 验证清单

- [ ] `pnpm install` 正常完成，Plate.js 相关依赖安装成功
- [ ] `pnpm tsc --noEmit` 无 TypeScript 编译错误
- [ ] `pnpm lint` 无 ESLint 错误
- [ ] 打开 `/notes/{path}` 能正确加载笔记内容
- [ ] 点击侧边栏文件能跳转到笔记页面
- [ ] 编辑内容后自动保存正常（2秒防抖）
- [ ] 工具栏快捷操作正常（加粗、斜体、标题等）
- [ ] 页面离开时如有待保存更改有提示
- [ ] 笔记头部正确显示元信息
- [ ] 加载状态显示骨架屏
- [ ] 错误状态显示错误提示
- [ ] 空笔记显示空内容占位
- [ ] 已有笔记内容正确渲染
- [ ] 纯前端路由下 `notFound()` 正确处理

---

## 技术注意事项

1. **SSR 兼容性**：Plate.js 使用大量浏览器 API，必须使用 `dynamic` 导入 + `ssr: false`
2. **路径编码**：笔记路径在 URL 中需要 `encodeURIComponent` 编码
3. **权限检查**：笔记页面在服务端加载时需要检查文件操作权限
4. **自动保存**：使用防抖（debounce）避免频繁保存，建议 2 秒延迟
5. **Markdown 格式**：Plate.js 使用 JSON AST 格式，内部存储；与后端交互用 Markdown 字符串
6. **只读模式**：编辑页面也支持只读模式（无写权限时）
7. **字数统计**：实时统计当前内容的字数/字符数
