"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { updateSystemConfigAction, validateNotesPathAction } from "@/app/actions/system";
import { AlertCircle, FolderOpen, Loader2 } from "lucide-react";

interface SystemConfigFormProps {
  initialPath: string;
}

export function SystemConfigForm({ initialPath }: SystemConfigFormProps) {
  const [path, setPath] = useState(initialPath);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const handleEdit = () => {
    setIsEditing(true);
    setError(null);
  };

  const handleCancel = () => {
    setPath(initialPath);
    setIsEditing(false);
    setError(null);
  };

  const handleValidate = async () => {
    setError(null);

    if (!path.trim()) {
      setError("路径不能为空");
      return false;
    }

    if (!path.startsWith("/")) {
      setError("必须使用绝对路径（以 / 开头）");
      return false;
    }

    const result = await validateNotesPathAction(path);
    if (!result.success) {
      setError(result.error || "验证失败");
      return false;
    }

    if (!result.valid) {
      setError(result.error || "路径无效");
      return false;
    }

    return true;
  };

  const handleSaveClick = async () => {
    const isValid = await handleValidate();
    if (isValid) {
      setShowConfirmDialog(true);
    }
  };

  const handleConfirmSave = async () => {
    setIsLoading(true);
    setShowConfirmDialog(false);

    const formData = new FormData();
    formData.append("notesRootPath", path);

    const result = await updateSystemConfigAction(formData);

    if (result.success) {
      setIsEditing(false);
      setError(null);
      // 刷新页面以应用新配置
      window.location.reload();
    } else {
      setError(result.error || "保存失败");
    }

    setIsLoading(false);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            笔记根目录配置
          </CardTitle>
          <CardDescription>
            配置笔记文件的存储根目录，修改后将影响所有用户的文件访问
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive" className="border-yellow-500/50 bg-yellow-500/10">
            <AlertCircle className="h-4 w-4 text-yellow-500" />
            <AlertTitle className="text-yellow-700 dark:text-yellow-400">警告</AlertTitle>
            <AlertDescription className="text-yellow-700 dark:text-yellow-400">
              修改笔记根目录后，原有的笔记文件将不可见，除非手动迁移数据。
              请确保新目录存在且有读写权限。
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="notesRootPath">当前笔记根目录</Label>
            {isEditing ? (
              <Input
                id="notesRootPath"
                value={path}
                onChange={(e) => setPath(e.target.value)}
                placeholder="/path/to/notes"
                disabled={isLoading}
              />
            ) : (
              <code className="bg-muted relative rounded px-[0.3rem] py-[0.2rem] font-mono text-sm">
                {initialPath}
              </code>
            )}
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button
                  onClick={handleSaveClick}
                  disabled={isLoading || path === initialPath}
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  保存
                </Button>
                <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
                  取消
                </Button>
              </>
            ) : (
              <Button onClick={handleEdit}>修改路径</Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认修改笔记根目录</DialogTitle>
            <DialogDescription>
              您确定要将笔记根目录修改为 <code className="text-primary bg-muted rounded px-1">{path}</code> 吗？
              <br />
              <br />
              此操作将立即生效，原有目录中的笔记将不再可见。如需保留数据，请先手动迁移文件。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              取消
            </Button>
            <Button onClick={handleConfirmSave}>
              确认修改
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
