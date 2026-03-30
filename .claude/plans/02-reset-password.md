# 步骤 2：重置密码

## 描述

实现「忘记密码 → 邮件验证码 → 重置密码」流程。依赖步骤1奠定的基础设施（Next.js 项目、类型定义、bcryptjs、nodemailer、zod）。

---

## 需要创建的路由

| 路由 | 文件 | 功能 |
|------|------|------|
| `/reset-password` | `src/app/reset-password/page.tsx` | 重置密码页面 |
| `/login` | `src/app/login/page.tsx` | 登录页面（占位，步骤3完善） |

---

## 需要创建的组件

| 组件 | 文件 | 说明 |
|------|------|------|
| ResetPasswordForm | `src/components/auth/ResetPasswordForm.tsx` | 两步表单：发送验证码 → 输入验证码和新密码重置 |

---

## 需要创建的类型

| 文件 | 类型 | 说明 |
|------|------|------|
| `src/types/config.ts` | `VerificationCode` | `{ email: string, code: string, expiresAt: number }` |
| `src/types/config.ts` | `AppConfig` | 新增 `verificationCodes?: VerificationCode[]` 字段 |

---

## 需要创建的 Server Actions

| 文件 | 函数 | 功能 |
|------|------|------|
| `src/app/actions/auth.ts` | `sendResetCode(email)` | 验证邮箱 → 生成 6 位验证码 → 保存到 config.json → 发送邮件 |
| `src/app/actions/auth.ts` | `resetPassword(email, code, newPassword)` | 验证验证码 → 更新用户密码哈希 → 删除已用验证码 |

---

## 需要创建的工具

| 文件 | 函数 | 说明 |
|------|------|------|
| `src/lib/email/sender.ts` | `sendEmail(to, subject, html)` | 使用 nodemailer 发送 SMTP 邮件 |
| `src/lib/validations/auth.ts` | `sendResetCodeSchema` | zod schema：邮箱格式验证 |
| `src/lib/validations/auth.ts` | `resetPasswordSchema` | zod schema：邮箱 + 6 位验证码 + 新密码 |

---

## 需要修改的现有文件

| 文件 | 修改内容 |
|------|----------|
| `config.json` | 新增 `verificationCodes: []` 数组字段 |
| `.env.example` | 新增 `CODE_EXPIRY=300` 验证码有效期（秒） |
| `src/app/layout.tsx` | 添加 `<Toaster />` 组件 |
| `src/lib/config/manager.ts` | 新增验证码相关方法：`addVerificationCode`、`getVerificationCode`、`removeVerificationCode`、`cleanExpiredCodes` |

---

## 详细实现要点

### Server Action: sendResetCode(email)

1. 使用 zod 验证邮箱格式
2. 从 config.json 查找该邮箱是否已注册
3. **防邮箱枚举**：无论是否注册，都返回"验证码已发送"（不泄露是否存在）
4. 生成 6 位数字验证码：`Math.floor(100000 + Math.random() * 900000).toString()`
5. 有效期：`CODE_EXPIRY` 环境变量（默认 300 秒）
6. 清理该邮箱的旧验证码（同一邮箱多次请求覆盖）
7. 保存新验证码到 `config.json.verificationCodes`
8. 发送邮件（包含验证码和有效期提示）
9. 返回成功

### Server Action: resetPassword(email, code, newPassword)

1. 使用 zod 验证输入（邮箱 + 6 位验证码 + 至少 8 位密码）
2. 从 config.json 查找该邮箱的最新验证码
3. 检查验证码是否过期（`expiresAt < Date.now()`）
4. 检查验证码是否匹配
5. 使用 bcrypt 加密新密码
6. 更新 config.json 中对应用户的 `passwordHash`
7. 删除已使用的验证码
8. 返回成功

### ResetPasswordForm 组件

**状态**：
- `step: 'send' | 'verify'`
- `email`, `code`, `newPassword`, `confirmPassword`
- `isLoading`, `countdown`, `error`, `success`

**第一步（发送）**：邮箱输入 → 调用 `sendResetCode` → 成功则切换到第二步 + 60 秒倒计时

**第二步（验证）**：验证码输入 + 新密码 + 确认密码 → 调用 `resetPassword` → 成功则跳转到 `/login`

**UI 组件**：Card, Input, Button, Label, Alert, useToast

---

## 需要安装的依赖

无新增依赖。所有依赖已在 01-init.md 中安装：
- bcryptjs, jose, nodemailer, zod
- @types/bcryptjs, @types/nodemailer
- shadcn/ui 组件：button, input, label, alert, card, separator, toast

---

## 提交 commit 信息

---

## 验证清单

- [ ] 输入有效邮箱，点击"发送验证码"，邮件发送成功（需配置 SMTP）
- [ ] 输入错误验证码，重置失败并显示错误
- [ ] 输入正确验证码和新密码，密码重置成功
- [ ] 验证码过期后无法重置
- [ ] 同一邮箱多次请求，旧验证码被新验证码覆盖
- [ ] 未注册邮箱不会泄露信息（统一响应"验证码已发送"）
- [ ] `pnpm tsc --noEmit` 无 TypeScript 编译错误
- [ ] `pnpm lint` 无 ESLint 错误
