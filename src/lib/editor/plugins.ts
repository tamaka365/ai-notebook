/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  BaseBasicBlocksPlugin,
  BaseBoldPlugin,
  BaseItalicPlugin,
  BaseUnderlinePlugin,
  BaseStrikethroughPlugin,
  BaseCodePlugin,
  BaseBlockquotePlugin,
  BaseH1Plugin,
  BaseH2Plugin,
  BaseH3Plugin,
  BaseH4Plugin,
  BaseH5Plugin,
  BaseH6Plugin,
  BaseHorizontalRulePlugin,
  BaseKbdPlugin,
} from "@platejs/basic-nodes";
import { BaseListPlugin } from "@platejs/list";
import { BaseLinkPlugin } from "@platejs/link";
import {
  BaseTablePlugin,
  BaseTableRowPlugin,
  BaseTableCellPlugin,
} from "@platejs/table";
import {
  BaseFontColorPlugin,
  BaseFontBackgroundColorPlugin,
  BaseFontFamilyPlugin,
  BaseFontSizePlugin,
  BaseFontWeightPlugin,
  BaseLineHeightPlugin,
  BaseTextAlignPlugin,
  BaseTextIndentPlugin,
} from "@platejs/basic-styles";
import { MarkdownPlugin } from "@platejs/markdown";
import { AutoformatPlugin } from "@platejs/autoformat";
import { FirstLineH1Plugin } from "./firstLineH1Plugin";
import type { AutoformatRule } from "@platejs/autoformat";

/**
 * Markdown 自动格式化规则
 * 支持在输入时自动转换 Markdown 语法为富文本格式
 */
const markdownAutoformatRules: AutoformatRule[] = [
  // 标题（注意：H1 在第一行会被 FirstLineH1Plugin 锁定，所以从 H2 开始）
  {
    mode: "block",
    type: "h2",
    match: "## ",
  },
  {
    mode: "block",
    type: "h3",
    match: "### ",
  },
  {
    mode: "block",
    type: "h4",
    match: "#### ",
  },
  {
    mode: "block",
    type: "h5",
    match: "##### ",
  },
  {
    mode: "block",
    type: "h6",
    match: "###### ",
  },
  // 无序列表
  {
    mode: "block",
    type: "ul",
    match: ["* ", "- ", "+ "],
  },
  // 有序列表
  {
    mode: "block",
    type: "ol",
    match: ["1. ", "2. ", "3. ", "4. ", "5. ", "6. ", "7. ", "8. ", "9. "],
  },
  // 引用块
  {
    mode: "block",
    type: "blockquote",
    match: "> ",
  },
  // 代码块
  {
    mode: "block",
    type: "code_block",
    match: "```",
  },
  // 粗体 **文字**
  {
    mode: "mark",
    type: "bold",
    match: "**",
  },
  // 粗体 __文字__
  {
    mode: "mark",
    type: "bold",
    match: "__",
  },
  // 斜体 *文字*
  {
    mode: "mark",
    type: "italic",
    match: "*",
  },
  // 斜体 _文字_
  {
    mode: "mark",
    type: "italic",
    match: "_",
  },
  // 删除线 ~~文字~~
  {
    mode: "mark",
    type: "strikethrough",
    match: "~~",
  },
  // 行内代码 `文字`
  {
    mode: "mark",
    type: "code",
    match: "`",
  },
  // 水平分割线
  {
    mode: "block",
    type: "hr",
    match: ["---", "***", "___"],
    triggerAtBlockStart: true,
  },
];

/**
 * 获取所有编辑器插件
 * 插件以对象形式直接使用（新版 @platejs API）
 */
export function getEditorPlugins(): any[] {
  return [
    FirstLineH1Plugin,
    MarkdownPlugin,
    AutoformatPlugin.configure({
      options: {
        rules: markdownAutoformatRules,
        enableUndoOnDelete: true,
      },
    }),
    BaseBasicBlocksPlugin,
    BaseBoldPlugin,
    BaseItalicPlugin,
    BaseUnderlinePlugin,
    BaseStrikethroughPlugin,
    BaseCodePlugin,
    BaseBlockquotePlugin,
    BaseH1Plugin,
    BaseH2Plugin,
    BaseH3Plugin,
    BaseH4Plugin,
    BaseH5Plugin,
    BaseH6Plugin,
    BaseHorizontalRulePlugin,
    BaseKbdPlugin,
    BaseListPlugin,
    BaseLinkPlugin,
    BaseTablePlugin,
    BaseTableRowPlugin,
    BaseTableCellPlugin,
    BaseFontColorPlugin,
    BaseFontBackgroundColorPlugin,
    BaseFontFamilyPlugin,
    BaseFontSizePlugin,
    BaseFontWeightPlugin,
    BaseLineHeightPlugin,
    BaseTextAlignPlugin,
    BaseTextIndentPlugin,
  ];
}
