/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useCallback } from "react";
import { Toggle } from "@/components/ui/toggle";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code2,
  Link,
  Minus,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Undo2,
  Redo2,
  ChevronDown,
} from "lucide-react";

interface EditorToolbarProps {
  editor: any; // PlateEditor instance
}

function isMarkActive(editor: any, key: string): boolean {
  return !!(editor.marks?.[key]);
}

function ToolBtn({
  onClick,
  disabled,
  children,
  title,
}: {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  title: string;
}) {
  return (
    <Toggle
      onPressedChange={onClick}
      disabled={disabled}
      size="sm"
      title={title}
      className="h-8 w-8 p-0 data-[state=on]:bg-accent data-[state=on]:text-accent-foreground"
    >
      {children}
    </Toggle>
  );
}

export function EditorToolbar({ editor }: EditorToolbarProps) {
  const toggleBold = useCallback(() => {
    if (isMarkActive(editor, "bold")) {
      editor.removeMark("bold");
    } else {
      editor.addMark("bold", true);
    }
  }, [editor]);

  const toggleItalic = useCallback(() => {
    if (isMarkActive(editor, "italic")) {
      editor.removeMark("italic");
    } else {
      editor.addMark("italic", true);
    }
  }, [editor]);

  const toggleUnderline = useCallback(() => {
    if (isMarkActive(editor, "underline")) {
      editor.removeMark("underline");
    } else {
      editor.addMark("underline", true);
    }
  }, [editor]);

  const toggleStrikethrough = useCallback(() => {
    if (isMarkActive(editor, "strikethrough")) {
      editor.removeMark("strikethrough");
    } else {
      editor.addMark("strikethrough", true);
    }
  }, [editor]);

  const toggleCode = useCallback(() => {
    if (isMarkActive(editor, "code")) {
      editor.removeMark("code");
    } else {
      editor.addMark("code", true);
    }
  }, [editor]);

  const insertBlock = useCallback(
    (type: string) => {
      editor.insertNodes({ type, children: [{ text: "" }] });
    },
    [editor]
  );

  const undo = useCallback(() => {
    editor.undo();
  }, [editor]);

  const redo = useCallback(() => {
    editor.redo();
  }, [editor]);

  return (
    <div className="border-b bg-card/50 overflow-x-auto">
      <div className="flex items-center gap-1 p-1.5 min-w-max">
        {/* 撤销/重做 */}
        <ToolBtn onClick={undo} disabled={!editor.canUndo} title="撤销 (Ctrl+Z)">
          <Undo2 className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn onClick={redo} disabled={!editor.canRedo} title="重做 (Ctrl+Y)">
          <Redo2 className="h-4 w-4" />
        </ToolBtn>

        <Separator orientation="vertical" className="mx-1 h-6" />

        {/* 标题下拉 */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 gap-1 px-2">
              <Heading1 className="h-4 w-4" />
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => insertBlock("h1")}>
              <Heading1 className="h-4 w-4 mr-2" />
              标题 1
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => insertBlock("h2")}>
              <Heading2 className="h-4 w-4 mr-2" />
              标题 2
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => insertBlock("h3")}>
              <Heading3 className="h-4 w-4 mr-2" />
              标题 3
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Separator orientation="vertical" className="mx-1 h-6" />

        {/* 基础格式 */}
        <ToolBtn onClick={toggleBold} title="加粗 (Ctrl+B)">
          <Bold className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn onClick={toggleItalic} title="斜体 (Ctrl+I)">
          <Italic className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn onClick={toggleUnderline} title="下划线 (Ctrl+U)">
          <UnderlineIcon className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn onClick={toggleStrikethrough} title="删除线">
          <Strikethrough className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn onClick={toggleCode} title="行内代码 (Ctrl+E)">
          <Code className="h-4 w-4" />
        </ToolBtn>

        <Separator orientation="vertical" className="mx-1 h-6" />

        {/* 列表 */}
        <ToolBtn onClick={() => insertBlock("ul")} title="无序列表">
          <List className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn onClick={() => insertBlock("ol")} title="有序列表">
          <ListOrdered className="h-4 w-4" />
        </ToolBtn>

        <Separator orientation="vertical" className="mx-1 h-6" />

        {/* 区块 */}
        <ToolBtn onClick={() => insertBlock("blockquote")} title="引用块">
          <Quote className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn onClick={() => insertBlock("code_block")} title="代码块">
          <Code2 className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn onClick={() => {}} title="链接">
          <Link className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn onClick={() => insertBlock("hr")} title="分割线">
          <Minus className="h-4 w-4" />
        </ToolBtn>

        <Separator orientation="vertical" className="mx-1 h-6" />

        {/* 对齐下拉 */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 gap-1 px-2">
              <AlignLeft className="h-4 w-4" />
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => {}}>
              <AlignLeft className="h-4 w-4 mr-2" />
              居左
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => {}}>
              <AlignCenter className="h-4 w-4 mr-2" />
              居中
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => {}}>
              <AlignRight className="h-4 w-4 mr-2" />
              居右
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => {}}>
              <AlignJustify className="h-4 w-4 mr-2" />
              两端对齐
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
