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
