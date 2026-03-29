import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth/jwt";

const PUBLIC_PATHS = [
  "/login",
  "/reset-password",
  "/api/auth/login",
  "/api/openapi.json",
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. 公开路径直接放行
  const isPublic =
    PUBLIC_PATHS.some(
      (path) => pathname === path || pathname.startsWith(path + "/")
    ) || pathname.startsWith("/_next/") || pathname === "/favicon.ico";

  if (isPublic) {
    return NextResponse.next();
  }

  // 2. /api/* 路由：验证 JWT Cookie
  if (pathname.startsWith("/api/")) {
    const token = request.cookies.get("ai_notebook_token")?.value;
    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "UNAUTHORIZED", message: "请先登录" },
        },
        { status: 401 }
      );
    }
    const session = await verifyToken(token);
    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "TOKEN_INVALID",
            message: "登录已过期，请重新登录",
          },
        },
        { status: 401 }
      );
    }
    // 注入用户信息到请求头
    const headers = new Headers(request.headers);
    headers.set("x-user-id", session.user.id);
    headers.set("x-user-role", session.user.role);
    return NextResponse.next({ request: { headers } });
  }

  return NextResponse.next();
}

export const proxyConfig = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
