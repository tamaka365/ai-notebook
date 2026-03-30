"use client";

import { useState, useCallback } from "react";
import type { FileNode } from "@/types/file";

export function useFileTree() {
  const [nodes, setNodes] = useState<FileNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTree = useCallback(async (path?: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = path ? `?path=${encodeURIComponent(path)}` : "";
      const res = await fetch(`/api/notes${params}`);
      const json = await res.json();
      if (json.success) {
        setNodes(json.data as FileNode[]);
      } else {
        setError(json.error.message);
      }
    } catch {
      setError("加载文件列表失败");
    } finally {
      setLoading(false);
    }
  }, []);

  const createNode = useCallback(async (
    type: "doc" | "group",
    name: string,
    parentId?: string
  ) => {
    const res = await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, name, parentId: parentId ?? null }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error.message);
    return json.data as FileNode;
  }, []);

  const deleteNode = useCallback(async (id: string) => {
    const res = await fetch(`/api/notes/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error.message);
  }, []);

  const renameNode = useCallback(async (id: string, newName: string) => {
    const res = await fetch("/api/notes", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, newName }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error.message);
    return json.data as FileNode;
  }, []);

  return { nodes, loading, error, fetchTree, createNode, deleteNode, renameNode };
}
