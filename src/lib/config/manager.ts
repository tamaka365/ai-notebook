import fs from "fs";
import path from "path";
import type { AppConfig, VerificationCode } from "@/types/config";

const CONFIG_PATH = path.resolve(process.cwd(), "config.json");

function readConfig(): AppConfig {
  const raw = fs.readFileSync(CONFIG_PATH, "utf-8");
  return JSON.parse(raw) as AppConfig;
}

function writeConfig(config: AppConfig): void {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), "utf-8");
}

/**
 * 获取完整配置
 */
export function getConfig(): AppConfig {
  return readConfig();
}

/**
 * 保存完整配置
 */
export function saveConfig(config: AppConfig): void {
  writeConfig(config);
}

/**
 * 获取某邮箱的最新验证码（未过期的）
 */
export function getVerificationCode(email: string): VerificationCode | null {
  const config = readConfig();
  const codes = config.verificationCodes ?? [];
  const now = Date.now();

  const valid = codes
    .filter((c) => c.email === email && c.expiresAt > now)
    .sort((a, b) => b.expiresAt - a.expiresAt); // 最新优先

  return valid[0] ?? null;
}

/**
 * 添加验证码（覆盖同邮箱旧验证码）
 */
export function addVerificationCode(code: VerificationCode): void {
  const config = readConfig();
  const codes = config.verificationCodes ?? [];

  // 移除同邮箱旧验证码
  const filtered = codes.filter((c) => c.email !== code.email);

  config.verificationCodes = [...filtered, code];
  writeConfig(config);
}

/**
 * 删除某邮箱的验证码
 */
export function removeVerificationCode(email: string): void {
  const config = readConfig();
  const codes = config.verificationCodes ?? [];

  config.verificationCodes = codes.filter((c) => c.email !== email);
  writeConfig(config);
}

/**
 * 清理所有已过期的验证码
 */
export function cleanExpiredCodes(): void {
  const config = readConfig();
  const codes = config.verificationCodes ?? [];
  const now = Date.now();

  config.verificationCodes = codes.filter((c) => c.expiresAt > now);
  writeConfig(config);
}
