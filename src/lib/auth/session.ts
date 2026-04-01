import { cookies } from "next/headers";
import { verifyToken, signToken } from "./jwt";
import type { Session, PublicUser } from "@/types/auth";

const TOKEN_COOKIE_NAME = "ai_notebook_token";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 天

/**
 * 从 Cookie 中读取并验证会话
 */
export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

/**
 * 创建会话（签发 JWT 并写入 HTTP-only Cookie）
 */
export async function setSession(user: PublicUser): Promise<void> {
  const cookieStore = await cookies();
  const token = await signToken(user);
  // COOKIE_SECURE 环境变量可覆盖 secure 设置
  // 设置为 "false" 可允许 HTTP 访问（如局域网 IP）
  const secure = process.env.COOKIE_SECURE === "true" ||
    (process.env.NODE_ENV === "production" && process.env.COOKIE_SECURE !== "false");

  cookieStore.set(TOKEN_COOKIE_NAME, token, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });
}

/**
 * 清除会话（删除 Cookie）
 */
export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(TOKEN_COOKIE_NAME);
}
