/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useCallback, useRef, useMemo } from "react";
import { Calendar, Clock } from "lucide-react";
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
  createdAt?: string;
  updatedAt?: string;
}

export function PlateEditorClient({
  id,
  initialContent = "",
  readOnly = false,
  createdAt,
  updatedAt,
}: PlateEditorClientProps) {
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [wordCount, setWordCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const editorRef = useRef<SlateEditor | null>(null);
  const lastSavedContentRef = useRef<string>(initialContent);

  // 计算字数
  const updateWordCount = useCallback((nodes: Value) => {
    const text = nodes.map((n) => ("text" in n ? n.text : "")).join(" ");
    const trimmed = text.trim();
    setWordCount(trimmed.length === 0 ? 0 : trimmed.split(/\s+/).filter(Boolean).length);
  }, []);

  // 序列化并保存
  const saveNow = useCallback(
    async (nodes: Value, content: string) => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();
      setIsSaving(true);
      setError(null);
      try {
        // 直接使用传入的序列化后的内容
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
        lastSavedContentRef.current = content; // 更新已保存内容的引用
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
    ({ value, editor }: { value: Value; editor: SlateEditor }) => {
      // 第一层过滤：检查是否有非选区的操作
      const contentOps = editor.operations?.filter(
        (op) => op.type !== "set_selection"
      );
      if (!contentOps || contentOps.length === 0) {
        return; // 只有选区变化，忽略
      }

      // 第二层过滤：比较 Markdown 内容是否真正变化
      const currentContent = serializeMd(editor, { value });
      if (currentContent === lastSavedContentRef.current) {
        return; // 内容未变，忽略
      }

      setIsDirty(true);
      updateWordCount(value);

      // 安全兜底：如果第一行被改成了非 H1，强制改回来
      const first = value[0] as TElement | undefined;
      if (first && first.type !== "h1") {
        // 等待一下让编辑器稳定后再修正确认选区安全
        setTimeout(() => {
          if (editorRef.current) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ((editorRef.current as unknown) as { setNodes: (props: { type: string }, options: { at: number[]; match: (n: unknown) => boolean }) => void }).setNodes(
              { type: "h1" },
              { at: [0], match: (n: unknown) => (n as { type?: string }).type !== "h1" }
            );
          }
        }, 0);
      }

      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }

      saveTimerRef.current = setTimeout(() => {
        saveNow(value, currentContent);
      }, 2000);
    },
    [saveNow, updateWordCount]
  );

  // 初始值 — 解析 Markdown 为 Slate 文档结构
  // 空白内容兜底为 H1（配合 API 层默认值，确保第一行始终是 H1）
  const initialValue = useMemo((): Value => {
    if (!initialContent || initialContent.trim() === "") {
      return [{ type: "h1", children: [{ text: "" }] } as TElement];
    }
    // 创建临时编辑器用于解析 Markdown
    const plugins = getEditorPlugins();
    const tempEditor = createPlateEditor({ plugins: plugins as any });
    const parsed = deserializeMd(tempEditor, initialContent);
    return parsed.length > 0 ? parsed : [{ type: "h1", children: [{ text: "" }] } as TElement];
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 创建编辑器，并拦截 setNodes / deleteBackward 以锁定第一行为 H1
  const editor = useMemo(() => {
    const plugins = getEditorPlugins();
    const e = createPlateEditor({
      plugins: plugins as any,
      value: initialValue,
    });

    // 保存原始方法引用（cast to any 避免 Plate override 后返回 unknown 的类型问题）
    const origSetNodes = (e as any).setNodes.bind(e);
    const origDeleteBackward = (e as any).deleteBackward.bind(e);
    const origToggleBlock = (e as any).tf?.toggleBlock?.bind(e.tf);

    // 辅助函数：检查操作是否影响第一行
    const affectsFirstLine = (options?: any): boolean => {
      // 如果指定了 at 路径，检查是否包含第一行 [0]
      if (options?.at) {
        const atPath = options.at;
        // at 可能是路径数组或 Range 对象
        if (Array.isArray(atPath) && atPath.length > 0 && atPath[0] === 0) {
          return true;
        }
        // 处理 Range 类型（anchor/focus）
        if (atPath.anchor?.path?.[0] === 0) return true;
      }
      // 检查当前选区是否在第一行
      if (e.selection?.anchor?.path?.[0] === 0) return true;
      return false;
    };

    // 拦截 setNodes：阻止将第一行改为非 H1 类型
    (e as any).setNodes = (override: any, options: any) => {
      // 如果正在修改 type 属性，且影响第一行，且目标类型不是 h1，则阻止
      if (
        override?.type !== undefined &&
        override.type !== "h1" &&
        affectsFirstLine(options)
      ) {
        return; // 静默阻止
      }
      return origSetNodes(override, options);
    };

    // 拦截 tf.toggleBlock：阻止在第一行切换块类型
    if (origToggleBlock) {
      (e as any).tf.toggleBlock = (type: string, options?: any) => {
        // 如果当前选区在第一行，阻止切换为非 h1 类型
        if (e.selection?.anchor?.path?.[0] === 0 && type !== "h1") {
          return; // 静默阻止
        }
        return origToggleBlock(type, options);
      };
    }

    // 拦截 deleteBackward：禁止删除唯一的 H1 第一行（但允许删除内容）
    (e as any).deleteBackward = (unit: any) => {
      const firstNode = e.children[0] as TElement | undefined;
      // 只有当第一行是 H1，且文档只有一行，且 H1 已经为空时，才阻止删除（防止删除块本身）
      if (
        e.selection &&
        e.selection.anchor.path[0] === 0 &&
        e.children.length === 1 &&
        firstNode?.type === "h1" &&
        firstNode.children.length === 1 &&
        (firstNode.children[0] as { text?: string })?.text === ""
      ) {
        return; // 阻止删除空 H1 块（防止删除整个块结构）
      }
      return origDeleteBackward(unit);
    };

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
      <div className="px-4 py-2 flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          {createdAt && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              创建: {new Date(createdAt).toLocaleDateString()}
            </span>
          )}
          {updatedAt && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              更新: {new Date(updatedAt).toLocaleDateString()}
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
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
    </div>
  );
}
