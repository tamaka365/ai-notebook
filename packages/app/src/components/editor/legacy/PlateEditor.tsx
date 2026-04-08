"use client";

import dynamic from "next/dynamic";
import { PlateEditorSkeleton } from "./PlateEditorSkeleton";

interface PlateEditorProps {
  id: string;
  initialContent?: string;
  readOnly?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// 禁用 SSR（Plate.js 使用浏览器 API）
export const PlateEditor = dynamic(
  () => import("./PlateEditorClient").then((m) => m.PlateEditorClient),
  {
    ssr: false,
    loading: () => <PlateEditorSkeleton />,
  }
) as React.ComponentType<PlateEditorProps>;
