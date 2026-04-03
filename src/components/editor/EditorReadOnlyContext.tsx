'use client';

import { createContext, useContext } from 'react';

/**
 * 编辑器系统层面只读状态的 Context
 * 用于区分用户手动切换的只读模式和系统强制只读模式（无编辑权限）
 */
export const EditorReadOnlyContext = createContext<boolean>(false);

export function useSystemReadOnly(): boolean {
  return useContext(EditorReadOnlyContext);
}
