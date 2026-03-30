/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useCallback, useRef, useMemo } from "react";
import { createPlateEditor, Plate, PlateContent } from "@platejs/core/react";
import { getEditorPlugins } from "@/lib/editor/plugins";
import { deserializeMd, serializeMd } from "@platejs/markdown";
import { EditorToolbar } from "./EditorToolbar";
import type { TElement, Value } from "@platejs/slate";
import type { SlateEditor } from "platejs";

interface PlateEditorClientProps {
  id: string;
  initialContent?: string;
  readOnly?: boolean;
}

export function PlateEditorClient({
  id,
  initialContent = "",
  readOnly = false,
}: PlateEditorClientProps) {
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [wordCount, setWordCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const editorRef = useRef<SlateEditor | null>(null);

  // 计算字数
  const updateWordCount = useCallback((nodes: Value) => {
    const text = nodes.map((n) => ("text" in n ? n.text : "")).join(" ");
    const trimmed = text.trim();
    setWordCount(trimmed.length === 0 ? 0 : trimmed.split(/\s+/).filter(Boolean).length);
  }, []);

  // 序列化并保存
  const saveNow = useCallback(
    async (nodes: Value) => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();
      setIsSaving(true);
      setError(null);
      try {
        // 将 Slate JSON 序列化为 Markdown 文本存储
        const content = serializeMd(editorRef.current!, { value: nodes });
        const response = await fetch(`/api/notes/${encodeURIComponent(id)}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content }),
          signal: abortControllerRef.current.signal,
        });
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error?.message || "保存失败");
        }
        setIsDirty(false);
        setLastSaved(new Date());
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setError((err as Error).message || "保存失败");
      } finally {
        setIsSaving(false);
      }
    },
    [id]
  );

  // 内容变化回调
  const handleChange = useCallback(
    ({ value }: { value: Value }) => {
      setIsDirty(true);
      updateWordCount(value);

      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }

      saveTimerRef.current = setTimeout(() => {
        saveNow(value);
      }, 2000);
    },
    [saveNow, updateWordCount]
  );

  // 初始值 — 解析 Markdown 为 Slate 文档结构
  const initialValue = useMemo((): Value => {
    if (!initialContent) {
      return [{ type: "p", children: [{ text: "" }] } as TElement];
    }
    // 创建临时编辑器用于解析 Markdown
    const plugins = getEditorPlugins();
    const tempEditor = createPlateEditor({ plugins: plugins as any });
    const parsed = deserializeMd(tempEditor, initialContent);
    return parsed.length > 0 ? parsed : [{ type: "p", children: [{ text: "" }] } as TElement];
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 创建编辑器
  const editor = useMemo(() => {
    const plugins = getEditorPlugins();
    const e = createPlateEditor({
      plugins: plugins as any,
      value: initialValue,
    });
    editorRef.current = e;
    return e;
  }, [initialValue]);

  return (
    <div className="flex flex-col h-full">
      {!readOnly && <EditorToolbar editor={editor} />}
      <div className="flex-1 overflow-auto">
        <Plate
          editor={editor}
          onChange={handleChange as any}
          readOnly={readOnly}
        >
          <PlateContent
            placeholder="开始写作..."
            className="prose prose-neutral dark:prose-invert max-w-none min-h-[500px]"
          />
        </Plate>
      </div>
      <div className="border-t px-4 py-2 flex items-center justify-between text-xs text-muted-foreground">
        <span>{wordCount} 字</span>
        {isSaving && <span>保存中...</span>}
        {isDirty && !isSaving && (
          <span className="text-yellow-500">有未保存的更改</span>
        )}
        {!isDirty && lastSaved && (
          <span>已保存于 {lastSaved.toLocaleTimeString()}</span>
        )}
        {error && <span className="text-red-500">{error}</span>}
      </div>
    </div>
  );
}
