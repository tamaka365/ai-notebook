import fs from "fs/promises";
import path from "path";
import { nanoid } from "nanoid";
import { getConfig } from "@/lib/config/manager";
import { triggerGitSync } from "@/lib/git/sync";
import type { FileNode, FileContent } from "@/types/file";
import {
  loadMetadata,
  saveMetadata,
  getItem,
  getChildren,
  getItemByPath,
  getLogicPath,
  addItem,
  updateItem,
  removeItem,
} from "./metadata";

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

/** 读取文件树 */
export async function readDir(relativePath?: string): Promise<FileNode[]> {
  const meta = await loadMetadata();

  if (!relativePath) {
    return getChildren(meta, meta.root.id);
  }

  const target = getItemByPath(meta, relativePath);
  if (!target || target.type !== "group") return [];
  return getChildren(meta, target.id);
}

/** 根据 id 读取文件内容 */
export async function readFile(id: string): Promise<FileContent> {
  const meta = await loadMetadata();
  const item = getItem(meta, id);
  if (!item || item.type !== "doc") throw new Error("ENOENT");

  const fullPath = path.join(getNotesRoot(), `${id}.md`);
  const content = await fs.readFile(fullPath, "utf-8");

  const nodePath = getLogicPath(meta, item.id);
  return {
    content,
    metadata: {
      ...item,
      path: nodePath,
    },
  };
}

/** 根据 id 写入文件内容 */
export async function writeFile(
  id: string,
  content: string,
  opts?: { name: string; parentId: string }
): Promise<FileNode> {
  const meta = await loadMetadata();
  let item = getItem(meta, id);

  if (!item) {
    if (!opts?.name || opts?.parentId === undefined) {
      throw new Error("ENOENT");
    }
    item = addItem(meta, {
      id,
      name: opts.name,
      parentId: opts.parentId,
      type: "doc",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    await saveMetadata(meta);
  }

  const fullPath = path.join(getNotesRoot(), `${item.id}.md`);
  await fs.writeFile(fullPath, content, "utf-8");
  const stat = await fs.stat(fullPath);
  updateItem(meta, id, { size: stat.size, updatedAt: stat.mtime.toISOString() });
  await saveMetadata(meta);

  const nodePath = getLogicPath(meta, item.id);
  triggerGitSync();
  return { ...item, path: nodePath };
}

/** 根据父目录 id 创建子文件夹 */
export async function createDir(parentId: string, name: string): Promise<FileNode> {
  const meta = await loadMetadata();
  const parent = getItem(meta, parentId);
  if (!parent || parent.type !== "group") throw new Error("目标目录不存在");

  const newItem = addItem(meta, {
    id: nanoid(),
    name,
    parentId,
    type: "group",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  await saveMetadata(meta);

  const nodePath = getLogicPath(meta, newItem.id);
  triggerGitSync();
  return { ...newItem, path: nodePath };
}

/** 根据 id 删除文件或文件夹 */
export async function deletePath(id: string): Promise<void> {
  const meta = await loadMetadata();
  const item = getItem(meta, id);
  if (!item) return;

  if (item.type === "doc") {
    const fullPath = path.join(getNotesRoot(), `${item.id}.md`);
    try {
      await fs.unlink(fullPath);
    } catch {
      // 文件不存在时忽略
    }
  }

  removeItem(meta, id);
  await saveMetadata(meta);
  triggerGitSync();
}

/** 根据 id 重命名 */
export async function renamePath(id: string, newName: string): Promise<FileNode> {
  const meta = await loadMetadata();
  const item = getItem(meta, id);
  if (!item) throw new Error("ENOENT");

  updateItem(meta, id, { name: newName });
  await saveMetadata(meta);

  const nodePath = getLogicPath(meta, item.id);
  triggerGitSync();
  return { ...item, name: newName, path: nodePath };
}

/** 根据逻辑路径解析出 FileNode */
export async function resolvePath(relativePath: string): Promise<ReturnType<typeof getItemByPath>> {
  const meta = await loadMetadata();
  return getItemByPath(meta, relativePath);
}
