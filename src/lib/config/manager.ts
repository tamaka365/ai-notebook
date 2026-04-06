import fs from "fs";
import path from "path";
import type { AppConfig, VerificationCode, SystemConfig } from "@/types/config";
import type { User } from "@/types/auth";

const CONFIG_PATH = path.resolve(process.cwd(), "config.json");

function readConfig(): AppConfig {
  try {
    const raw = fs.readFileSync(CONFIG_PATH, "utf-8");
    return JSON.parse(raw) as AppConfig;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      // 文件不存在时创建默认配置
      const defaultConfig: AppConfig = {
        system: {
          notesRootPath: path.join(process.cwd(), "notes"),
        },
        users: [],
        verificationCodes: [],
      };
      fs.writeFileSync(CONFIG_PATH, JSON.stringify(defaultConfig, null, 2), "utf-8");
      return defaultConfig;
    }
    throw error;
  }
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
 * 根据用户名查找用户
 */
export function getUserByUsername(username: string): User | null {
  const config = readConfig();
  return config.users.find((u) => u.username === username) ?? null;
}

/**
 * 根据邮箱查找用户
 */
export function getUserByEmail(email: string): User | null {
  const config = readConfig();
  return config.users.find((u) => u.email === email) ?? null;
}

/**
 * 根据 ID 查找用户
 */
export function getUserById(id: string): User | null {
  const config = readConfig();
  return config.users.find((u) => u.id === id) ?? null;
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

/**
 * 获取所有用户列表
 */
export function getUsers(): User[] {
  const config = readConfig();
  return config.users;
}

/**
 * 创建用户
 */
export function createUser(
  userData: Omit<User, "id" | "createdAt" | "updatedAt" | "passwordHash" | "status"> & {
    password: string;
  }
): User {
  const config = readConfig();

  // 检查用户名是否已存在
  if (config.users.some((u) => u.username === userData.username)) {
    throw new Error("用户名已存在");
  }

  // 检查邮箱是否已存在
  if (config.users.some((u) => u.email === userData.email)) {
    throw new Error("邮箱已被注册");
  }

  const now = new Date().toISOString();
  const newUser: User = {
    id: crypto.randomUUID(),
    username: userData.username,
    email: userData.email,
    passwordHash: "", // 由调用方使用 bcrypt 加密后设置
    role: userData.role,
    status: "active",
    permissions: userData.permissions,
    createdAt: now,
    updatedAt: now,
  };

  config.users.push(newUser);
  writeConfig(config);

  return newUser;
}

/**
 * 更新用户信息
 */
export function updateUser(
  id: string,
  data: Partial<Pick<User, "email" | "role" | "status" | "permissions">>
): User {
  const config = readConfig();
  const userIndex = config.users.findIndex((u) => u.id === id);

  if (userIndex === -1) {
    throw new Error("用户不存在");
  }

  const user = config.users[userIndex]!;

  // 如果修改邮箱，检查是否与其他用户冲突
  if (data.email && data.email !== user.email) {
    if (config.users.some((u) => u.id !== id && u.email === data.email)) {
      throw new Error("邮箱已被其他用户使用");
    }
  }

  config.users[userIndex] = {
    ...user,
    ...data,
    updatedAt: new Date().toISOString(),
  };

  writeConfig(config);

  return config.users[userIndex]!;
}

/**
 * 删除用户
 */
export function deleteUser(id: string): void {
  const config = readConfig();

  // 防止删除最后一个管理员
  const user = config.users.find((u) => u.id === id);
  if (user?.role === "admin") {
    const adminCount = config.users.filter((u) => u.role === "admin").length;
    if (adminCount <= 1) {
      throw new Error("不能删除最后一个管理员");
    }
  }

  config.users = config.users.filter((u) => u.id !== id);
  writeConfig(config);
}

/**
 * 更新用户密码
 */
export function updateUserPassword(id: string, passwordHash: string): void {
  const config = readConfig();
  const userIndex = config.users.findIndex((u) => u.id === id);

  if (userIndex === -1) {
    throw new Error("用户不存在");
  }

  config.users[userIndex]!.passwordHash = passwordHash;
  config.users[userIndex]!.updatedAt = new Date().toISOString();

  writeConfig(config);
}

/**
 * 获取系统配置
 */
export function getSystemConfig(): SystemConfig {
  const config = readConfig();
  return config.system;
}

/**
 * 更新系统配置
 * @param systemConfig 新的系统配置
 */
export function updateSystemConfig(
  systemConfig: Partial<SystemConfig>
): SystemConfig {
  const config = readConfig();

  config.system = {
    ...config.system,
    ...systemConfig,
    updatedAt: new Date().toISOString(),
  };

  writeConfig(config);
  return config.system;
}

/**
 * 验证笔记根目录路径是否有效
 * @param path 要验证的路径
 * @returns 验证结果 { valid: boolean; error?: string }
 */
export function validateNotesRootPath(path: string): { valid: boolean; error?: string } {
  try {
    // 检查路径是否存在
    if (!fs.existsSync(path)) {
      return { valid: false, error: "路径不存在" };
    }

    // 检查是否为目录
    const stats = fs.statSync(path);
    if (!stats.isDirectory()) {
      return { valid: false, error: "路径不是目录" };
    }

    // 检查是否有读写权限
    try {
      fs.accessSync(path, fs.constants.R_OK | fs.constants.W_OK);
    } catch {
      return { valid: false, error: "没有目录的读写权限" };
    }

    return { valid: true };
  } catch (error) {
    return { valid: false, error: `验证失败: ${(error as Error).message}` };
  }
}
