'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Calendar, Clock } from 'lucide-react';
import { Plate, usePlateEditor } from 'platejs/react';
import { EditorKit } from '@/components/editor/editor-kit';
import { Editor, EditorContainer } from '@/components/ui/editor';
import { deserializeMd, serializeMd } from '@platejs/markdown';
import type { Value } from 'platejs';
import { FixedToolbar } from '@/components/ui/fixed-toolbar';
import { FixedToolbarButtons } from '@/components/ui/fixed-toolbar-buttons';

interface NoteEditorProps {
  id: string;
  initialContent?: string;
  readOnly?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// 空白内容时的默认值
const emptyValue: Value = [
  {
    type: 'p',
    children: [{ text: '' }],
  },
];

export function NoteEditor({
  id,
  initialContent = '',
  readOnly = false,
  createdAt,
  updatedAt,
}: NoteEditorProps) {
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [wordCount, setWordCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastSavedContentRef = useRef<string>(initialContent);
  const isInitializedRef = useRef(false);

  // 创建编辑器
  const editor = usePlateEditor({
    plugins: EditorKit,
    value: emptyValue,
  });

  // 初始加载内容
  useEffect(() => {
    if (isInitializedRef.current || !editor) return;

    if (initialContent && initialContent.trim() !== '') {
      try {
        const parsed = deserializeMd(editor, initialContent);
        editor.children = parsed.length > 0 ? parsed : emptyValue;
      } catch {
        editor.children = emptyValue;
      }
    }

    // 计算初始字数
    const text = editor.children
      .map(n => ('text' in n ? (n.text as string) : ''))
      .join(' ');
    const trimmed = text.trim();
    setWordCount(
      trimmed.length === 0 ? 0 : trimmed.split(/\s+/).filter(Boolean).length,
    );

    isInitializedRef.current = true;
  }, [editor, initialContent]);

  // 计算字数
  const updateWordCount = useCallback((nodes: Value) => {
    const text = nodes.map(n => ('text' in n ? n.text : '')).join(' ');
    const trimmed = text.trim();
    setWordCount(
      trimmed.length === 0 ? 0 : trimmed.split(/\s+/).filter(Boolean).length,
    );
  }, []);

  // 序列化并保存
  const saveNow = useCallback(
    async (content: string) => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();
      setIsSaving(true);
      setError(null);
      try {
        const response = await fetch(`/api/notes/${encodeURIComponent(id)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content }),
          signal: abortControllerRef.current.signal,
        });
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error?.message || '保存失败');
        }
        setIsDirty(false);
        setLastSaved(new Date());
        lastSavedContentRef.current = content;
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
        setError((err as Error).message || '保存失败');
      } finally {
        setIsSaving(false);
      }
    },
    [id],
  );

  // 内容变化回调
  const handleChange = useCallback(
    ({ value }: { value: Value }) => {
      if (!editor) return;

      // 序列化为 Markdown
      const currentContent = serializeMd(editor);
      if (currentContent === lastSavedContentRef.current) {
        return; // 内容未变，忽略
      }

      setIsDirty(true);
      updateWordCount(value);

      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }

      saveTimerRef.current = setTimeout(() => {
        saveNow(currentContent);
      }, 2000);
    },
    [editor, saveNow, updateWordCount],
  );

  // 清理
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-hidden">
        <Plate editor={editor} onChange={handleChange} readOnly={readOnly}>
          <FixedToolbar>
            <FixedToolbarButtons />
          </FixedToolbar>
          <EditorContainer className="overflow-y-auto flex flex-col">
            <div className="w-full max-w-175 self-center">
              <Editor
                variant="default"
                placeholder="开始写作..."
              />
            </div>
          </EditorContainer>
        </Plate>
      </div>
      <div className="px-4 py-2 flex items-center justify-between text-xs text-muted-foreground border-t">
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
