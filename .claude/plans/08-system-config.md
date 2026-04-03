# 步骤 8：系统配置管理

## 描述
实现系统配置功能，允许管理员在 `/settings` 页面查看和修改系统级配置，包括笔记根目录路径。

---

## 已完成的修改

### 前端

- [x] 创建 `src/components/settings/SystemConfigForm.tsx`（显示/修改笔记根目录路径）
  - 显示当前笔记根目录路径
  - 支持修改路径（需管理员权限验证）
  - 路径合法性验证（必须存在且为目录）
  - 提交时确认对话框（警告：修改后现有笔记将不可见）
- [x] 更新 `src/app/(protected)/settings/page.tsx`（添加 Tabs 标签页组件）
  - 「用户管理」标签页
  - 「系统配置」标签页

### 后端

- [x] 创建 `src/app/actions/system.ts`（Server Actions）
  - `getSystemConfigAction` - 获取系统配置
  - `updateSystemConfigAction` - 更新系统配置
  - `validateNotesPathAction` - 验证路径有效性
- [x] 更新 `src/lib/config/manager.ts`
  - `getSystemConfig()` - 获取系统配置
  - `updateSystemConfig()` - 更新系统配置
  - `validateNotesRootPath()` - 验证路径有效性
- [x] 创建 `src/lib/validations/system.ts`（zod 验证 schema）
- [x] 更新 `src/types/config.ts`（添加 `updatedAt` 字段）
- [x] 更新 `src/types/api.ts`（添加系统配置相关类型）

### 依赖

- [x] 安装 shadcn/ui Tabs 组件：`pnpm dlx shadcn add tabs`

---

## 验证

- [x] `pnpm tsc --noEmit` 无 TypeScript 编译错误
- [x] `pnpm lint` 新文件无 ESLint 错误
- [ ] 能查看当前笔记根目录
- [ ] 修改后文件列表路径更新

---

## 文件清单

### 新建文件

| 文件路径 | 用途 |
|----------|------|
| `src/components/settings/SystemConfigForm.tsx` | 系统配置表单组件 |
| `src/lib/validations/system.ts` | 系统配置验证 schema |
| `src/app/actions/system.ts` | 系统配置 Server Actions |
| `src/components/ui/tabs.tsx` | shadcn/ui Tabs 组件 |

### 修改文件

| 文件路径 | 修改内容 |
|----------|----------|
| `src/lib/config/manager.ts` | 新增 `getSystemConfig`, `updateSystemConfig`, `validateNotesRootPath` 函数 |
| `src/types/config.ts` | 为 `SystemConfig` 添加 `updatedAt` 字段 |
| `src/types/api.ts` | 新增系统配置相关 API 类型 |
| `src/app/(protected)/settings/page.tsx` | 添加 Tabs 组件，整合用户管理和系统配置两个标签页 |

---

## 注意事项

1. **路径变更影响**: 修改 `notesRootPath` 后，原有的笔记文件将不可见。UI 中已添加明确的黄色警告框说明此风险。

2. **路径验证**: 在保存前会验证路径是否存在、是否为目录、是否有读写权限。

3. **数据迁移**: 如需迁移旧数据，需要手动复制文件到新目录，本功能仅修改配置路径。

4. **热重载**: 修改配置后需要刷新页面以应用新配置。
