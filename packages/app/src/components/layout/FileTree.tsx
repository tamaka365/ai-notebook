"use client";

import { parse } from "path";
import { ChevronRight, ChevronDown, BookOpen, MoreHorizontal, Pencil, Trash2, FolderPlus, FolderOpen, Folder } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { FileNode } from "@/types/file";

// 自定义 Markdown 文件图标（基于 FileCode 修改，将 <> 改为 M）
function FileMd({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* 文件轮廓 */}
      <path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z" />
      {/* 右上角折叠 */}
      <path d="M14 2v5a1 1 0 0 0 1 1h5" />
      {/* M 字母 - 居中显示 */}
      <path d="M9.5 16V12l2.5 2.5 2.5-2.5v4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

interface FileTreeProps {
  nodes: FileNode[];
  selectedNoteId?: string;
  expandedNodeIds?: Record<string, boolean>;
  onSelect: (node: FileNode) => void;
  onContextMenu?: (node: FileNode, e: React.MouseEvent) => void;
  onRename?: (node: FileNode) => void;
  onDelete?: (node: FileNode) => void;
  onCreateFolder?: (node: FileNode) => void;
  onCreateNote?: (node: FileNode) => void;
  onToggleExpand?: (nodeId: string) => void;
  depth?: number;
}

export function FileTree({ nodes, selectedNoteId, expandedNodeIds, onSelect, onContextMenu, onRename, onDelete, onCreateFolder, onCreateNote, onToggleExpand, depth = 0 }: FileTreeProps) {
  const toggleExpand = (node: FileNode) => {
    onToggleExpand?.(node.id);
  };

  // 过滤：显示所有文件夹和文件
  const visibleNodes = nodes.filter(
    (node) => node.type === "group" || node.type === "doc"
  );

  if (visibleNodes.length === 0) {
    return (
      <p className="py-2 text-xs text-muted-foreground">
        {depth === 0 ? "暂无文件" : ""}
      </p>
    );
  }

  return (
    <ul className="space-y-0.5">
      {visibleNodes.map((node) => {
        const isFolder = node.type === "group";
        const isExpanded = expandedNodeIds?.[node.id] ?? false;
        const isSelected = selectedNoteId === node.id;
        const hasChildren = isFolder && node.children && node.children.length > 0;
        const displayName = node.type === "group" ? node.name : parse(node.name).name;

        return (
          <li key={node.id}>
            <div
              className={`group/item flex items-center gap-1 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors ${
                isSelected
                  ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                  : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              }`}
              style={{ paddingLeft: `${depth * 16 + 8}px` }}
              onClick={(e) => {
                // 如果是文件夹且没有子节点，不触发任何操作
                if (isFolder && !hasChildren) return;
                e.stopPropagation();
                if (isFolder && hasChildren) toggleExpand(node);
                onSelect(node);
              }}
              onContextMenu={(e) => { e.preventDefault(); onContextMenu?.(node, e); }}
            >
              {isFolder && hasChildren && (
                <span className="w-4 flex-shrink-0">
                  {isExpanded ? (
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                </span>
              )}
              {!hasChildren && <span className="w-4 flex-shrink-0" />}

              {isFolder ? (
                depth === 0 ? (
                  <BookOpen className="h-4 w-4 shrink-0 text-indigo-500" />
                ) : isExpanded ? (
                  <FolderOpen className="h-4 w-4 shrink-0 text-amber-500" />
                ) : (
                  <Folder className="h-4 w-4 shrink-0 text-amber-500" />
                )
              ) : (
                <FileMd className="h-4 w-4 shrink-0 text-blue-500" />
              )}

              <span className="truncate flex-1">{displayName}</span>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover/item:opacity-100 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreHorizontal className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  onClick={(e) => e.stopPropagation()}
                  align="end"
                >
                  <DropdownMenuItem onClick={() => onRename?.(node)}>
                    <Pencil className="h-4 w-4" />
                    重命名
                  </DropdownMenuItem>
                  {isFolder && (
                    <>
                      <DropdownMenuItem onClick={() => onCreateNote?.(node)}>
                        <FileMd className="h-4 w-4" />
                        新建笔记
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onCreateFolder?.(node)}>
                        <FolderPlus className="h-4 w-4" />
                        新建分类
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => onDelete?.(node)}
                    disabled={isFolder && hasChildren}
                  >
                    <Trash2 className="h-4 w-4" />
                    删除
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {isFolder && isExpanded && node.children && (
              <FileTree
                nodes={node.children}
                selectedNoteId={selectedNoteId}
                expandedNodeIds={expandedNodeIds}
                onSelect={onSelect}
                onContextMenu={onContextMenu}
                onRename={onRename}
                onDelete={onDelete}
                onCreateFolder={onCreateFolder}
                onCreateNote={onCreateNote}
                onToggleExpand={onToggleExpand}
                depth={depth + 1}
              />
            )}
          </li>
        );
      })}
    </ul>
  );
}
