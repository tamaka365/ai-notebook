import { SignJWT, jwtVerify } from "jose";
import type { Session, PublicUser } from "@/types/auth";

const getSecret = () =>
  new TextEncoder().encode(process.env.AUTH_SECRET ?? "fallback-secret");

/**
 * 签发 JWT Token
 * @param payload 用户公开信息
 * @param expiresIn 过期时间，默认 7 天
 */
export async function signToken(
  payload: PublicUser,
  expiresIn = "7 days"
): Promise<string> {
  const secret = getSecret();
  return new SignJWT({ user: payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(secret);
}

/**
 * 验证 JWT Token
 * @returns Session 或 null（无效/过期）
 */
export async function verifyToken(
  token: string
): Promise<Session | null> {
  try {
    const secret = getSecret();
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as Session;
  } catch {
    return null;
  }
}
