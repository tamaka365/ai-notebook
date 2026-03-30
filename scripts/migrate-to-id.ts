/**
 * 一次性迁移脚本：将嵌套文件夹结构迁移到扁平结构
 *
 * 功能：
 * 1. 递归扫描 notes/ 目录，收集所有 .md 文件
 * 2. 将所有文件移动到 notes/ 根目录，重命名为 {id}.md
 * 3. 从现有 .metadata.json 读取文件夹结构，或根据磁盘路径重建
 * 4. 生成新的 .metadata.json，记录所有文件夹和文件的层级关系
 *
 * 用法：npx tsx scripts/migrate-to-id.ts
 */

import fs from "fs/promises";
import path from "path";
import { nanoid } from "nanoid";

interface FileMeta {
  id: string;
  name: string;
  parentId: string | null;
  type: "file" | "folder";
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  size?: number;
}

interface NotesMetadata {
  version: number;
  rootId: string;
  items: Record<string, FileMeta>;
}

/** 清理显示名称，移除旧的 [id_xxx]- 前缀 */
function cleanDisplayName(name: string): string {
  // 匹配 [id_xxx]-名称 或 旧格式 xxx_名称
  return name.replace(/^\[id_[A-Za-z0-9_-]{21}\]-/, "").replace(/^[A-Za-z0-9_-]{21}_/, "");
}

interface ScanResult {
  files: Array<{
    oldPath: string;
    name: string;
    parentPath: string;
    stat: Awaited<ReturnType<typeof fs.stat>>;
  }>;
  folders: Array<{
    oldPath: string;
    name: string;
    parentPath: string;
    stat: Awaited<ReturnType<typeof fs.stat>>;
  }>;
}

/** 递归扫描目录，返回所有文件和文件夹 */
async function scanDirectory(dirPath: string, parentPath: string): Promise<ScanResult> {
  const result: ScanResult = { files: [], folders: [] };
  const entries = await fs.readdir(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    const stat = await fs.stat(fullPath);
    const relativePath = path.join(parentPath, entry.name);

    if (entry.name === ".metadata.json" || entry.name === ".gitkeep") continue;

    if (entry.isDirectory()) {
      result.folders.push({
        oldPath: fullPath,
        name: entry.name,
        parentPath,
        stat,
      });
      // 递归扫描子目录
      const subResult = await scanDirectory(fullPath, relativePath);
      result.files.push(...subResult.files);
      result.folders.push(...subResult.folders);
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      // 去掉 .md 扩展名作为显示名称
      const displayName = entry.name.slice(0, -3);
      result.files.push({
        oldPath: fullPath,
        name: displayName,
        parentPath,
        stat,
      });
    }
  }

  return result;
}

/** 从路径片段构建文件夹结构，返回 folderIdMap（parentPath -> id） */
function buildFolderStructure(
  folders: ScanResult["folders"],
  rootId: string
): { folderIdMap: Map<string, string>; items: Record<string, FileMeta> } {
  const items: Record<string, FileMeta> = {
    [rootId]: {
      id: rootId,
      name: "",
      parentId: null,
      type: "folder",
      sortOrder: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  };
  const folderIdMap = new Map<string, string>();
  folderIdMap.set("", rootId); // 空路径映射到根目录

  // 按路径深度排序，确保父文件夹先处理
  const sortedFolders = [...folders].sort((a, b) => {
    const depthA = a.parentPath.split("/").filter(Boolean).length;
    const depthB = b.parentPath.split("/").filter(Boolean).length;
    return depthA - depthB;
  });

  for (const folder of sortedFolders) {
    const id = nanoid();
    const cleanName = cleanDisplayName(folder.name);
    const parentId = folderIdMap.get(folder.parentPath) ?? rootId;
    folderIdMap.set(folder.parentPath === "" ? folder.name : `${folder.parentPath}/${folder.name}`, id);

    items[id] = {
      id,
      name: cleanName,
      parentId,
      type: "folder",
      sortOrder: 0,
      createdAt: folder.stat.birthtime.toISOString(),
      updatedAt: folder.stat.mtime.toISOString(),
    };
  }

  return { folderIdMap, items };
}

/** 计算 sortOrder */
function getNextSortOrder(items: Record<string, FileMeta>, parentId: string | null): number {
  const siblings = Object.values(items).filter((item) => item.parentId === parentId);
  if (siblings.length === 0) return 0;
  return Math.max(...siblings.map((s) => s.sortOrder)) + 1;
}

async function main() {
  // 读取配置获取 notesRootPath
  const configPath = path.resolve(process.cwd(), "config.json");
  let notesRoot: string;
  try {
    const configRaw = await fs.readFile(configPath, "utf-8");
    const config: { system: { notesRootPath: string } } = JSON.parse(configRaw);
    notesRoot = path.resolve(process.cwd(), config.system.notesRootPath);
  } catch {
    console.error("无法读取 config.json，请确保项目根目录存在配置文件。");
    process.exit(1);
  }

  console.log(`扫描目录: ${notesRoot}`);

  // 扫描目录
  const scanResult = await scanDirectory(notesRoot, "");

  console.log(`\n找到 ${scanResult.files.length} 个文件`);
  console.log(`找到 ${scanResult.folders.length} 个文件夹`);

  // 构建文件夹结构
  const rootId = nanoid();
  const { folderIdMap, items: folderItems } = buildFolderStructure(scanResult.folders, rootId);

  // 处理文件
  console.log("\n处理文件...");
  const moveOperations: Array<{ oldPath: string; newPath: string }> = [];

  for (let i = 0; i < scanResult.files.length; i++) {
    const file = scanResult.files[i]!;
    const id = nanoid();
    const newPath = path.join(notesRoot, `${id}.md`);
    const cleanName = cleanDisplayName(file.name);

    moveOperations.push({ oldPath: file.oldPath, newPath });

    const parentId = folderIdMap.get(file.parentPath) ?? rootId;
    folderItems[id] = {
      id,
      name: cleanName,
      parentId,
      type: "file",
      sortOrder: getNextSortOrder(folderItems, parentId),
      createdAt: file.stat.birthtime.toISOString(),
      updatedAt: file.stat.mtime.toISOString(),
      size: Number(file.stat.size),
    };

    console.log(`  ${cleanName} → ${id}.md`);
  }

  // 执行文件移动（先移动深层的，再移动浅层的）
  console.log("\n执行文件迁移...");
  const sortedOps = moveOperations.sort((a, b) => {
    const depthA = a.oldPath.split(path.sep).length;
    const depthB = b.oldPath.split(path.sep).length;
    return depthB - depthA;
  });

  for (const op of sortedOps) {
    await fs.rename(op.oldPath, op.newPath);
  }

  // 删除空文件夹（先删除深层的）
  console.log("\n删除空文件夹...");
  const sortedFolders = [...scanResult.folders].sort((a, b) => {
    const depthA = a.oldPath.split(path.sep).length;
    const depthB = b.oldPath.split(path.sep).length;
    return depthB - depthA;
  });

  for (const folder of sortedFolders) {
    try {
      await fs.rm(folder.oldPath);
    } catch {
      // 可能还有其他文件未删除
    }
  }

  // 写入 metadata.json
  const meta: NotesMetadata = {
    version: 1,
    rootId,
    items: folderItems,
  };

  const metaPath = path.join(notesRoot, ".metadata.json");
  await fs.writeFile(metaPath, JSON.stringify(meta, null, 2), "utf-8");

  // 汇总
  const fileCount = Object.values(folderItems).filter((i) => i.type === "file").length;
  const folderCount = Object.values(folderItems).filter((i) => i.type === "folder").length;
  console.log(`\n迁移完成！`);
  console.log(`  文件数: ${fileCount}`);
  console.log(`  文件夹数: ${folderCount}`);
  console.log(`  元数据: ${metaPath}`);
}

main().catch((err) => {
  console.error("迁移失败:", err);
  process.exit(1);
});
