import { Button } from "@/components/ui/button";
import { FilePlus, FolderPlus } from "lucide-react";

export function Sidebar() {
  return (
    <aside className="flex w-72 flex-col border-r">
      <div className="flex gap-2 border-b p-3">
        <Button variant="outline" size="sm" className="flex-1 gap-1">
          <FilePlus className="h-4 w-4" />
          新建文件
        </Button>
        <Button variant="outline" size="sm" className="flex-1 gap-1">
          <FolderPlus className="h-4 w-4" />
          新建文件夹
        </Button>
      </div>
      <div className="flex-1 overflow-auto p-3">
        <p className="text-sm text-muted-foreground">文件树加载中...</p>
      </div>
    </aside>
  );
}
