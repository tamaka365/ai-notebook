# 步骤 9：OpenAPI 文档

## 描述
生成完整的 OpenAPI 3.0 规范文档，提供 API 可视化界面。

---

## 后端

- [ ] 创建 `lib/openapi/generator.ts`（OpenAPI 文档生成器）
- [ ] 创建 `app/api/openapi.json/route.ts`（GET：返回 OpenAPI JSON 文档）
- [ ] 可选：创建 `/api/docs` 页面使用 Swagger UI 或 Redoc 显示文档

## 前端

- [ ] 可选：在 Header 添加「API 文档」链接

---

## 验证

- [ ] `GET /api/openapi.json` 返回符合 OpenAPI 3.0 规范的 JSON
- [ ] Swagger UI 正确渲染所有接口
