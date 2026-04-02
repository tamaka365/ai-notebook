import { NextRequest, NextResponse } from "next/server";
import { getUserByEmail } from "@/lib/config/manager";
import { verifyPassword } from "@/lib/auth/password";
import { setSession } from "@/lib/auth/session";
import type { ApiResponse, LoginRequest, LoginResponse } from "@/types/api";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as LoginRequest;

    // 1. 验证必填字段
    if (!body.email || !body.password) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: { code: "INVALID_INPUT", message: "邮箱和密码不能为空" },
        },
        { status: 400 }
      );
    }

    // 2. 查找用户
    const user = getUserByEmail(body.email);
    if (!user) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: { code: "INVALID_CREDENTIALS", message: "邮箱或密码错误" },
        },
        { status: 401 }
      );
    }

    // 3. 检查用户状态
    if (user.status === "disabled") {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: { code: "ACCOUNT_DISABLED", message: "账号已被禁用" },
        },
        { status: 403 }
      );
    }

    // 4. 验证密码
    const isValid = await verifyPassword(body.password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: { code: "INVALID_CREDENTIALS", message: "邮箱或密码错误" },
        },
        { status: 401 }
      );
    }

    // 5. 构建公开用户信息（不含 passwordHash）
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _, ...publicUser } = user;

    // 6. 创建会话（写入 HTTP-only Cookie）
    await setSession(publicUser);

    // 7. 返回用户信息
    const response: ApiResponse<LoginResponse> = {
      success: true,
      data: {
        token: "", // Token 已写入 Cookie，前端可从 Cookie 读取
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          email: user.email,
        },
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("登录失败:", error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: { code: "INTERNAL_ERROR", message: "服务器内部错误" },
      },
      { status: 500 }
    );
  }
}
