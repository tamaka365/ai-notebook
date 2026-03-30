/* eslint-disable @typescript-eslint/no-explicit-any */
import { BaseBasicBlocksPlugin, BaseBoldPlugin, BaseItalicPlugin, BaseUnderlinePlugin, BaseStrikethroughPlugin, BaseCodePlugin, BaseBlockquotePlugin, BaseH1Plugin, BaseH2Plugin, BaseH3Plugin, BaseH4Plugin, BaseH5Plugin, BaseH6Plugin, BaseHorizontalRulePlugin, BaseKbdPlugin } from "@platejs/basic-nodes";
import { BaseListPlugin } from "@platejs/list";
import { BaseLinkPlugin } from "@platejs/link";
import { BaseTablePlugin, BaseTableRowPlugin, BaseTableCellPlugin } from "@platejs/table";
import { BaseFontColorPlugin, BaseFontBackgroundColorPlugin, BaseFontFamilyPlugin, BaseFontSizePlugin, BaseFontWeightPlugin, BaseLineHeightPlugin, BaseTextAlignPlugin, BaseTextIndentPlugin } from "@platejs/basic-styles";
import { MarkdownPlugin } from "@platejs/markdown";

/**
 * 获取所有编辑器插件
 * 插件以对象形式直接使用（新版 @platejs API）
 */
export function getEditorPlugins(): any[] {
  return [
    MarkdownPlugin,
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
