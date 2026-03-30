# 步骤 8：系统配置

## 描述
实现系统配置功能，允许管理员修改笔记根目录路径。

---

## 前端

- [ ] 创建 `components/settings/SystemConfig.tsx`（显示/修改笔记根目录路径）
- [ ] 调用 `updateNotesRootPath(path)` Server Action 保存

## 后端

- [ ] 创建 `app/actions/config.ts`（Server Action：`updateNotesRootPath`）
- [ ] 更新 `lib/config/manager.ts` 的 `updateNotesRootPath` 方法

---

## 验证

- [ ] 能查看当前笔记根目录
- [ ] 修改后文件列表路径更新
