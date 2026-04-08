#!/usr/bin/env tsx
/**
 * 创建默认管理员用户
 *
 * 用法：pnpm tsx scripts/create-default-user.ts
 */

import * as bcrypt from "bcryptjs";
import * as fs from "fs";
import * as path from "path";
import * as readline from "readline";
import type { AppConfig } from "../src/types/config";
import type { User } from "../src/types/auth";

const CONFIG_PATH = path.resolve(process.cwd(), "config.json");

/**
 * 创建 readline 接口用于交互式输入
 */
function createReadlineInterface(): readline.Interface {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

/**
 * 提示用户输入并隐藏密码
 */
async function prompt(rl: readline.Interface, question: string, hideInput = false): Promise<string> {
  if (!hideInput) {
    return new Promise((resolve) => {
      rl.question(question, (answer) => resolve(answer));
    });
  }

  // 隐藏密码输入
  return new Promise((resolve) => {
    const tty = (process.stdin as any).isTTY;

    if (!tty) {
      // 非 TTY 环境（如管道输入），直接读取
      rl.question(question, (answer) => resolve(answer));
      return;
    }

    process.stdin.setRawMode!(true);
    process.stdin.resume();

    let password = "";

    process.stdout.write(question);

    const onData = (key: Buffer): void => {
      const char = key.toString();

      if (char === "\u0003") {
        // Ctrl+C
        process.exit(130);
      }

      if (char === "\r" || char === "\n") {
        // Enter 键
        process.stdin.removeListener("data", onData);
        process.stdin.setRawMode!(false);
        process.stdin.pause();
        process.stdout.write("\n");
        resolve(password);
        return;
      }

      if (char === "\u007f" || char === "\b") {
        // Backspace
        if (password.length > 0) {
          password = password.slice(0, -1);
          process.stdout.write("\b \b");
        }
        return;
      }

      if (char.length === 1 && char >= " ") {
        password += char;
        process.stdout.write("*");
      }
    };

    process.stdin.on("data", onData);
  });
}

/**
 * 从用户输入获取账号信息
 */
async function getUserInput(rl: readline.Interface): Promise<{
  email: string;
  username: string;
  password: string;
}> {
  console.log("=== 创建管理员用户 ===\n");

  const email = await prompt(rl, "请输入邮箱地址：");
  const username = await prompt(rl, "请输入用户名：");
  const password = await prompt(rl, "请输入密码：", true);
  const confirmPassword = await prompt(rl, "请再次输入密码：", true);

  if (password !== confirmPassword) {
    throw new Error("两次输入的密码不一致");
  }

  if (!email || !username || !password) {
    throw new Error("邮箱、用户名和密码不能为空");
  }

  return { email, username, password };
}

async function createDefaultUser(): Promise<void> {
  let config: AppConfig;

  // 读取或初始化配置文件
  try {
    const raw = fs.readFileSync(CONFIG_PATH, "utf-8");
    config = JSON.parse(raw) as AppConfig;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      config = {
        system: {
          notesRootPath: path.join(process.cwd(), "notes"),
        },
        users: [],
        verificationCodes: [],
      };
    } else {
      throw error;
    }
  }

  const rl = createReadlineInterface();

  try {
    const { email, username, password } = await getUserInput(rl);

    // 检查用户是否已存在
    const existingUser = config.users.find(
      (u) => u.email === email || u.username === username
    );

    if (existingUser) {
      console.log(`用户 ${existingUser.username} 已存在，跳过创建`);
      return;
    }

    // 加密密码
    const passwordHash = await bcrypt.hash(password, 10);

    // 创建用户
    const now = new Date().toISOString();
    const newUser: User = {
      id: crypto.randomUUID(),
      username,
      email,
      passwordHash,
      role: "admin" as const,
      status: "active",
      permissions: {
        canCreateWorkspace: true,
        workspaces: [],
      },
      createdAt: now,
      updatedAt: now,
    };

    config.users.push(newUser);

    // 写入配置文件
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), "utf-8");

    console.log("\n✅ 管理员用户已创建：");
    console.log(`   邮箱：${email}`);
    console.log(`   用户名：${username}`);
    console.log(`   角色：管理员`);
    console.log(`\n⚠️  请妥善保管密码，建议在首次登录后尽快修改！`);
  } finally {
    rl.close();
  }
}

createDefaultUser().catch((error) => {
  console.error("\n❌ 创建用户失败:", error.message);
  process.exit(1);
});
