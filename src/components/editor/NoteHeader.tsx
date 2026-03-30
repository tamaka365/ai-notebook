"use client";

import { FileText, Calendar, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface NoteHeaderProps {
  name: string;
  createdAt: string;
  updatedAt: string;
  isDirty: boolean;
  isSaving: boolean;
}

export function NoteHeader({
  name,
  createdAt,
  updatedAt,
  isDirty,
  isSaving,
}: NoteHeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/30">
      <div className="flex items-center gap-3 min-w-0">
        <FileText className="w-4 h-4 shrink-0 text-muted-foreground" />
        <span className="font-medium truncate">{name}</span>
        {isDirty && (
          <Badge variant="secondary" className="text-xs">
            有更改
          </Badge>
        )}
        {isSaving && (
          <Badge variant="default" className="text-xs">
            保存中...
          </Badge>
        )}
      </div>
      <div className="flex items-center gap-4 text-xs text-muted-foreground shrink-0">
        <span className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          创建: {new Date(createdAt).toLocaleDateString()}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          更新: {new Date(updatedAt).toLocaleDateString()}
        </span>
      </div>
    </div>
  );
}
