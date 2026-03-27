export interface FileNode {
  id: string;
  name: string;
  path: string;
  type: "file" | "folder";
  children?: FileNode[];
  createdAt: string;
  updatedAt: string;
  size?: number;
}

export interface FileContent {
  content: string;
  metadata: FileNode;
}
