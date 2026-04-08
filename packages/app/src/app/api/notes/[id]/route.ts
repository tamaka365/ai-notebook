import { NextRequest } from "next/server";
import { ok, fail, unauthorized, notFound } from "@/lib/api-response";
import { getSession } from "@/lib/auth/session";
import { deletePath, readFile, writeFile } from "@/lib/fs/notes";

/**
 * GET /api/notes/[id]
 * 根据 ID 读取单个笔记内容
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return unauthorized();
    }

    const { id } = await params;
    const content = await readFile(id);
    return ok(content);
  } catch (error) {
    if ((error as Error).message === "ENOENT") {
      return notFound();
    }
    console.error("读取文件失败:", error);
    return fail("INTERNAL_ERROR", "读取文件失败", 500);
  }
}

/**
 * DELETE /api/notes/[id]
 * 根据 ID 删除笔记或文件夹
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return unauthorized();
    }

    const { id } = await params;
    await deletePath(id);
    return ok({ success: true });
  } catch (error) {
    console.error("删除失败:", error);
    return fail("INTERNAL_ERROR", "删除失败", 500);
  }
}

/**
 * PUT /api/notes/[id]
 * 保存笔记内容
 * 请求体：
 *   - content: string
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return unauthorized();
    }

    const { id } = await params;
    const body = await request.json();
    const { content } = body as { content: string };

    if (content === undefined) {
      return fail("INVALID_INPUT", "缺少内容", 400);
    }

    await writeFile(id, content);
    return ok({ success: true });
  } catch (error) {
    if ((error as Error).message === "ENOENT") {
      return notFound();
    }
    console.error("保存失败:", error);
    return fail("INTERNAL_ERROR", "保存失败", 500);
  }
}
