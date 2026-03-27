"use server";

import bcrypt from "bcryptjs";
import { sendEmail } from "@/lib/email/sender";
import {
  getConfig,
  getVerificationCode,
  addVerificationCode,
  removeVerificationCode,
} from "@/lib/config/manager";
import { sendResetCodeSchema, resetPasswordSchema } from "@/lib/validations/auth";
import type { VerificationCode } from "@/types/config";

/**
 * 发送重置密码验证码
 */
export async function sendResetCode(formData: FormData) {
  const email = formData.get("email") as string;

  // 1. 验证邮箱格式
  const parsed = sendResetCodeSchema.safeParse({ email });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "输入验证失败" };
  }

  // 2. 防邮箱枚举：无论是否注册，都返回"验证码已发送"
  // （不泄露该邮箱是否已注册）

  // 3. 生成 6 位验证码
  const code = Math.floor(100000 + Math.random() * 900000).toString();

  // 4. 计算过期时间
  const expirySeconds = Number(process.env.CODE_EXPIRY) || 300;
  const expiresAt = Date.now() + expirySeconds * 1000;

  // 5. 清理旧验证码，保存新验证码
  const verificationCode: VerificationCode = { email, code, expiresAt };
  addVerificationCode(verificationCode);

  // 6. 发送邮件
  try {
    await sendEmail(
      email,
      "AI Notebook - 重置密码验证码",
      `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #333;">重置密码验证码</h2>
          <p>您好，</p>
          <p>您收到了这封邮件，因为有人请求重置与您的账户关联的密码。</p>
          <p style="font-size: 24px; font-weight: bold; letter-spacing: 4px; color: #2563eb; margin: 24px 0;">
            ${code}
          </p>
          <p>验证码有效期为 <strong>${expirySeconds / 60} 分钟</strong>，请勿泄露给他人。</p>
          <p>如果您没有请求重置密码，请忽略此邮件。</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
          <p style="color: #666; font-size: 12px;">— AI Notebook</p>
        </div>
      `
    );
  } catch (error) {
    console.error("发送邮件失败:", error);
    return { success: false, error: "邮件发送失败，请稍后重试" };
  }

  return { success: true };
}

/**
 * 重置密码
 */
export async function resetPassword(formData: FormData) {
  const email = formData.get("email") as string;
  const code = formData.get("code") as string;
  const newPassword = formData.get("newPassword") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  // 1. 验证输入
  const parsed = resetPasswordSchema.safeParse({
    email,
    code,
    newPassword,
    confirmPassword,
  });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "输入验证失败" };
  }

  // 2. 检查验证码是否存在且未过期
  const storedCode = getVerificationCode(email);
  if (!storedCode) {
    return { success: false, error: "验证码不存在或已过期，请重新获取" };
  }

  // 3. 检查验证码是否匹配
  if (storedCode.code !== code) {
    return { success: false, error: "验证码错误，请检查后重新输入" };
  }

  // 4. 查找用户
  const config = getConfig();
  const user = config.users.find((u) => u.email === email);

  if (!user) {
    // 防邮箱枚举：理论上不会走到这里，因为验证码本身说明邮箱存在
    return { success: false, error: "用户不存在" };
  }

  // 5. bcrypt 加密新密码
  const passwordHash = await bcrypt.hash(newPassword, 10);

  // 6. 更新用户密码
  const userIndex = config.users.findIndex((u) => u.email === email);
  if (userIndex === -1) {
    return { success: false, error: "用户不存在" };
  }
  config.users[userIndex]!.passwordHash = passwordHash;
  config.users[userIndex]!.updatedAt = new Date().toISOString();

  // 7. 删除已用验证码
  removeVerificationCode(email);

  // 8. 保存配置
  const fs = await import("fs");
  const path = await import("path");
  const CONFIG_PATH = path.resolve(process.cwd(), "config.json");
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), "utf-8");

  return { success: true };
}
