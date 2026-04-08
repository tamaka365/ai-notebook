"use client";

import { useState, useCallback, useRef, useEffect } from "react";

interface UseNoteEditorOptions {
  path: string;
  initialContent?: string;
  autoSaveDelay?: number;
}

interface UseNoteEditorReturn {
  content: string;
  setContent: (content: string) => void;
  isDirty: boolean;
  isSaving: boolean;
  lastSaved: Date | null;
  error: string | null;
  save: () => Promise<void>;
  loadNote: (path: string) => Promise<void>;
  wordCount: number;
}

export function useNoteEditor({
  path: initialPath,
  initialContent = "",
  autoSaveDelay = 2000,
}: UseNoteEditorOptions): UseNoteEditorReturn {
  const [content, setContent] = useState(initialContent);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [wordCount, setWordCount] = useState(0);
  const [currentPath, setCurrentPath] = useState(initialPath);

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const saveRef = useRef<() => Promise<void>>(() => Promise.resolve());

  // 计算字数
  useEffect(() => {
    const trimmed = content.trim();
    setWordCount(trimmed.length === 0 ? 0 : trimmed.split(/\s+/).filter(Boolean).length);
  }, [content]);

  // 内容变化时标记脏
  useEffect(() => {
    if (content !== initialContent) {
      setIsDirty(true);
    } else {
      setIsDirty(false);
    }
  }, [content, initialContent]);

  const doSave = useCallback(async () => {
    if (!isDirty || isSaving) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/notes/${encodeURIComponent(currentPath)}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content }),
          signal: abortControllerRef.current.signal,
        }
      );

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
  }, [content, isDirty, isSaving, currentPath]);

  // 保持最新的 doSave 引用
  useEffect(() => {
    saveRef.current = doSave;
  }, [doSave]);

  // 自动保存（防抖）
  useEffect(() => {
    if (!isDirty || isSaving) return;

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = setTimeout(() => {
      saveRef.current();
    }, autoSaveDelay);

    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [isDirty, isSaving, autoSaveDelay]);

  const save = useCallback(async () => {
    await saveRef.current();
  }, []);

  const loadNote = useCallback(async (path: string) => {
    setCurrentPath(path);
    setError(null);
    setIsSaving(false);
    setIsDirty(false);

    try {
      const response = await fetch(`/api/notes/${encodeURIComponent(path)}`);
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || "加载失败");
      }
      const data = await response.json();
      setContent(data.data.content);
      setLastSaved(new Date());
    } catch (err) {
      setError((err as Error).message || "加载失败");
    }
  }, []);

  return {
    content,
    setContent,
    isDirty,
    isSaving,
    lastSaved,
    error,
    save,
    loadNote,
    wordCount,
  };
}
