import { z } from "zod";

/**
 * 系统配置验证 schema
 */
export const systemConfigSchema = z.object({
  notesRootPath: z
    .string()
    .min(1, "路径不能为空")
    .regex(/^\//, "必须使用绝对路径（以 / 开头）")
    .regex(/^[/a-zA-Z0-9._@-]+$/, "路径包含非法字符"),
});

/**
 * 更新系统配置请求类型
 */
export const updateSystemConfigSchema = z.object({
  notesRootPath: z.string().min(1, "路径不能为空"),
});

export type SystemConfigInput = z.infer<typeof systemConfigSchema>;
export type UpdateSystemConfigInput = z.infer<typeof updateSystemConfigSchema>;
