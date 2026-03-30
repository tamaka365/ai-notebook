import fs from "fs/promises";
import path from "path";
import { getNotesRoot } from "./notes";
import type { FileNode, FileNodeInput, NotesMetadata } from "@/types/file";

export function getMetaPath(): string {
  return path.join(getNotesRoot(), ".metadata.json");
}

/** 递归查找节点 */
function findNode(root: FileNode, id: string): FileNode | null {
  if (root.id === id) return root;
  if (root.children) {
    for (const child of root.children) {
      const found = findNode(child, id);
      if (found) return found;
    }
  }
  return null;
}

/** 递归查找父节点 */
function findParent(root: FileNode, id: string): FileNode | null {
  if (root.children) {
    for (const child of root.children) {
      if (child.id === id) return root;
      const found = findParent(child, id);
      if (found) return found;
    }
  }
  return null;
}

/** 加载元数据，不存在则创建默认结构 */
export async function loadMetadata(): Promise<NotesMetadata> {
  const metaPath = getMetaPath();
  try {
    const raw = await fs.readFile(metaPath, "utf-8");
    return JSON.parse(raw) as NotesMetadata;
  } catch {
    const root: FileNode = {
      id: "root",
      name: "",
      type: "group",
      sortOrder: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      path: "",
      children: [],
    };
    const meta: NotesMetadata = { version: 1, root };
    await saveMetadata(meta);
    return meta;
  }
}

/** 写回元数据文件 */
export async function saveMetadata(meta: NotesMetadata): Promise<void> {
  const metaPath = getMetaPath();
  await fs.writeFile(metaPath, JSON.stringify(meta, null, 2), "utf-8");
}

/** 通过 id 查询单条记录 */
export function getItem(meta: NotesMetadata, id: string): FileNode | null {
  return findNode(meta.root, id);
}

/** 获取指定父目录的所有直接子项（不含孙子项） */
export function getChildren(meta: NotesMetadata, parentId: string): FileNode[] {
  const parent = findNode(meta.root, parentId);
  if (!parent || parent.type !== "group" || !parent.children) return [];
  return [...parent.children].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
}

/** 计算某节点在元数据中的逻辑路径 */
export function getLogicPath(meta: NotesMetadata, id: string): string {
  const paths: string[] = [];
  let current: FileNode | null = findNode(meta.root, id);
  while (current && current.id !== meta.root.id) {
    paths.unshift(current.name);
    current = findParent(meta.root, current.id);
  }
  return paths.join("/");
}

/** 根据逻辑路径查找对应的 FileNode */
export function getItemByPath(meta: NotesMetadata, relativePath: string): FileNode | null {
  if (!relativePath) return meta.root;
  const segments = relativePath.split("/");
  let current = meta.root;
  for (const seg of segments) {
    if (!current.children) return null;
    const child = current.children.find((c) => c.name === seg);
    if (!child) return null;
    current = child;
  }
  return current;
}

/** 添加新记录，自动设置 sortOrder */
export function addItem(meta: NotesMetadata, item: FileNodeInput): FileNode {
  const parent = findNode(meta.root, item.parentId ?? meta.root.id);
  if (!parent || parent.type !== "group") {
    throw new Error("父目录不存在");
  }
  if (!parent.children) parent.children = [];

  const siblings = parent.children;
  const newSortOrder = siblings.length > 0
    ? Math.max(...siblings.map((s) => s.sortOrder)) + 1
    : 0;

  const newNode: FileNode = {
    id: item.id,
    name: item.name,
    type: item.type,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    size: item.size,
    sortOrder: newSortOrder,
    path: "",
  };
  parent.children.push(newNode);
  return newNode;
}

/** 更新记录 */
export function updateItem(meta: NotesMetadata, id: string, patch: Partial<Omit<FileNode, "id" | "children" | "path">>): FileNode | null {
  const node = findNode(meta.root, id);
  if (!node) return null;
  Object.assign(node, patch, { updatedAt: new Date().toISOString() });
  return node;
}

/** 移除记录及其所有后代 */
export function removeItem(meta: NotesMetadata, id: string): void {
  const parent = findParent(meta.root, id);
  if (!parent || !parent.children) return;
  parent.children = parent.children.filter((c) => c.id !== id);
}
