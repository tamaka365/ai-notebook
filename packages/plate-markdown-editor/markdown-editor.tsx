'use client';

import type { Value } from 'platejs';
import { Plate, usePlateEditor } from 'platejs/react';

import { EditorKit } from './plate-playground-template/src/components/editor/editor-kit';
import { Editor, EditorContainer, type EditorProps } from './plate-playground-template/src/components/ui/editor';

export interface MarkdownEditorProps
  extends Omit<EditorProps, 'value' | 'onChange'> {
  value?: Value;
  onChange?: (options: { value: Value }) => void;
}

export function MarkdownEditor({
  value,
  onChange,
  ...props
}: MarkdownEditorProps) {
  const editor = usePlateEditor({
    plugins: EditorKit,
    value,
  });

  return (
    <Plate editor={editor} onChange={onChange}>
      <EditorContainer>
        <Editor {...props} />
      </EditorContainer>
    </Plate>
  );
}
