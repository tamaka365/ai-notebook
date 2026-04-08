/* eslint-disable @typescript-eslint/no-explicit-any */
import { createSlatePlugin } from "@platejs/core";

/**
 * FirstLineH1Plugin — 锁定笔记第一行始终为 H1
 * 核心锁定逻辑在 PlateEditorClient.tsx 中实现。
 */
export const FirstLineH1Plugin = createSlatePlugin({ key: "firstLineH1" });
