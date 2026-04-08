import { NextRequest } from "next/server";
import { ok, fail, unauthorized } from "@/lib/api-response";
import { getSession } from "@/lib/auth/session";
import { readDir, createDir, writeFile } from "@/lib/fs/notes";
import { nanoid } from "nanoid";

/**
 * GET /api/notes
 * 获取文件树结构
 * 查询参数：
 *   - path?: 指定目录路径，不传则返回根目录
 *   - info?: "root" 时返回根节点信息
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return unauthorized();
    }

    const searchParams = request.nextUrl.searchParams;
    const path = searchParams.get("path") || undefined;
    const info = searchParams.get("info");

    if (info === "root") {
      // 返回根节点信息
      const meta = await import("@/lib/fs/metadata").then((m) => m.loadMetadata());
      return ok({ id: meta.root.id, name: "root", type: "group" as const });
    }

    const nodes = await readDir(path);
    return ok(nodes);
  } catch (error) {
    console.error("读取目录失败:", error);
    return fail("INTERNAL_ERROR", "读取目录失败", 500);
  }
}

/**
 * POST /api/notes
 * 创建新节点（文件夹或文档）
 * 请求体：
 *   - type: "group" | "doc"
 *   - name: string
 *   - parentId?: string (不传则创建到根目录)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return unauthorized();
    }

    const body = await request.json();
    const { type, name, parentId } = body as {
      type: "group" | "doc";
      name: string;
      parentId?: string;
    };

    if (!type || !name) {
      return fail("INVALID_INPUT", "缺少必填字段", 400);
    }

    // 获取根节点 ID（如果未指定父目录）
    const meta = await import("@/lib/fs/metadata").then((m) => m.loadMetadata());
    const targetParentId = parentId || meta.root.id;

    if (type === "group") {
      const node = await createDir(targetParentId, name);
      return ok(node, 201);
    }

    if (type === "doc") {
      // 创建文档时生成随机 ID
      const id = nanoid();
      const node = await writeFile(id, "", { name, parentId: targetParentId });
      return ok(node, 201);
    }

    return fail("INVALID_INPUT", "不支持的类型", 400);
  } catch (error) {
    console.error("创建节点失败:", error);
    return fail("INTERNAL_ERROR", "创建节点失败", 500);
  }
}

/**
 * PUT /api/notes
 * 重命名节点
 * 请求体：
 *   - id: string
 *   - newName: string
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return unauthorized();
    }

    const body = await request.json();
    const { id, newName } = body as { id: string; newName: string };

    if (!id || !newName) {
      return fail("INVALID_INPUT", "缺少必填字段", 400);
    }

    const { renamePath } = await import("@/lib/fs/notes");
    const node = await renamePath(id, newName);
    return ok(node);
  } catch (error) {
    console.error("重命名失败:", error);
    return fail("INTERNAL_ERROR", "重命名失败", 500);
  }
}
