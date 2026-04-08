export interface FileNode {
  id: string;
  name: string;
  type: "group" | "doc";
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  size?: number;
  /** 逻辑路径 */
  path: string;
  /** 子项 */
  children?: FileNode[];
}

/** 创建新节点时的输入类型（不含 computed 字段） */
export type FileNodeInput = Omit<FileNode, "path" | "children" | "size" | "sortOrder"> & {
  size?: number;
  children?: FileNode[];
  parentId: string;
  sortOrder?: number;
};

export interface NotesMetadata {
  version: number;
  root: FileNode;
}

export interface FileContent {
  content: string;
  metadata: FileNode;
}
