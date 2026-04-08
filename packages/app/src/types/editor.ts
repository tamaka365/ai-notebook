/**
 * 编辑器相关类型定义
 */

// 编辑器状态
export interface EditorState {
  content: string;
  lastSaved: number | null;
  isDirty: boolean;
  isSaving: boolean;
}

// 笔记详情
export interface NoteDetail {
  content: string;
  metadata: NoteMetadata;
}

// 笔记元信息
export interface NoteMetadata {
  id: string;
  name: string;
  path: string;
  type: "doc";
  createdAt: string;
  updatedAt: string;
  size?: number;
}

// 笔记列表项
export interface NoteItem {
  id: string;
  name: string;
  path: string;
  type: "doc" | "group";
  createdAt: string;
  updatedAt: string;
  size?: number;
}

// 搜索结果
export interface SearchResult {
  path: string;
  name: string;
  preview: string;
  matchCount: number;
}

// 快捷键命令
export interface EditorCommand {
  id: string;
  label: string;
  icon?: string;
  shortcut?: string;
  action: () => void;
}
