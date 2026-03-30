# 步骤 7：用户管理

## 描述
实现管理员用户管理界面，支持创建、编辑、删除、启用/禁用用户。

---

## 前端

- [ ] 创建 `app/(protected)/settings/page.tsx`（仅管理员可访问，非管理员重定向 `/`）
- [ ] 创建 `components/settings/UserList.tsx`（用户列表 + 操作按钮）
- [ ] 创建 `components/settings/UserForm.tsx`（新建/编辑用户表单：用户名、邮箱、角色、目录权限、操作权限）
- [ ] 「新建用户」按钮打开 `UserForm` 对话框
- [ ] 编辑/删除按钮调用对应 Server Action

## 后端

- [ ] 创建 `app/actions/users.ts`（Server Action：`createUser`、`updateUser`、`deleteUser`、`toggleUserStatus`、`updateUserPermissions`）
- [ ] 所有 Action 内部检查管理员权限
- [ ] 创建用户时密码存储 bcrypt hash

---

## 验证

- [ ] 只有管理员能访问 `/settings`
- [ ] 能正常新建、编辑、删除、启用/禁用用户
