"use client";

import { PlateEditor } from "@/components/editor/PlateEditor";
import { NoteHeader } from "@/components/editor/NoteHeader";
import type { NoteMetadata } from "@/types/editor";

interface NoteEditorPageProps {
  initialContent: string;
  metadata: NoteMetadata;
  readOnly?: boolean;
}

export function NoteEditorPage({
  initialContent,
  metadata,
  readOnly = false,
}: NoteEditorPageProps) {
  return (
    <div className="flex flex-col h-full">
      <NoteHeader
        name={metadata.name}
        createdAt={metadata.createdAt}
        updatedAt={metadata.updatedAt}
        isDirty={false}
        isSaving={false}
      />
      <div className="flex-1 overflow-hidden">
        <PlateEditor
          id={metadata.id}
          initialContent={initialContent}
          readOnly={readOnly}
        />
      </div>
    </div>
  );
}
