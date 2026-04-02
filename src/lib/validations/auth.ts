import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "请输入邮箱地址")
    .email("请输入有效的邮箱地址"),
  password: z.string().min(1, "请输入密码"),
});

export const sendResetCodeSchema = z.object({
  email: z
    .string()
    .min(1, "请输入邮箱地址")
    .email("请输入有效的邮箱地址"),
});

export const resetPasswordSchema = z
  .object({
    email: z
      .string()
      .min(1, "请输入邮箱地址")
      .email("请输入有效的邮箱地址"),
    code: z
      .string()
      .length(6, "验证码必须是 6 位")
      .regex(/^\d+$/, "验证码必须是数字"),
    newPassword: z
      .string()
      .min(8, "密码至少 8 位"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "两次输入的密码不一致",
    path: ["confirmPassword"],
  });
