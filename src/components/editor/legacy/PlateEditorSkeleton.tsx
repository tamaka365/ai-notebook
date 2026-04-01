"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function PlateEditorSkeleton() {
  return (
    <div className="flex flex-col h-full">
      {/* 工具栏骨架 */}
      <div className="border-b p-2 flex gap-2">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="w-8 h-8" />
        ))}
      </div>
      {/* 内容骨架 */}
      <div className="flex-1 p-4 space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton
            key={i}
            className="h-4"
            style={{ width: `${60 + ((i * 17) % 40)}%` }}
          />
        ))}
      </div>
    </div>
  );
}
