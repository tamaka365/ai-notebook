"use client";

import { useEffect } from "react";
import type { PlateEditor } from "@platejs/core/react";

interface ShortcutCallbacks {
  onSave?: () => void;
  onBold?: () => void;
  onItalic?: () => void;
}

export function useEditorKeyboardShortcuts(
  editor: PlateEditor,
  callbacks: ShortcutCallbacks
): void {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMod = e.ctrlKey || e.metaKey;

      // Ctrl/Cmd + S: 保存
      if (isMod && (e.key === "s" || e.key === "S")) {
        e.preventDefault();
        callbacks.onSave?.();
        return;
      }

      // Ctrl/Cmd + B: 加粗
      if (isMod && (e.key === "b" || e.key === "B")) {
        e.preventDefault();
        callbacks.onBold?.();
        return;
      }

      // Ctrl/Cmd + I: 斜体
      if (isMod && (e.key === "i" || e.key === "I")) {
        e.preventDefault();
        callbacks.onItalic?.();
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [callbacks]);
}
