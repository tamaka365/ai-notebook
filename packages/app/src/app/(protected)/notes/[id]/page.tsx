import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { readFile } from "@/lib/fs/notes";
import { NoteEditor } from "@/components/editor/NoteEditor";

interface NotePageProps {
  params: Promise<{ id: string }>;
}

/**
 * 获取笔记内容
 */
async function getNote(id: string) {
  try {
    return await readFile(id);
  } catch (error) {
    if ((error as Error).message === "ENOENT") {
      return null;
    }
    throw error;
  }
}

export default async function NotePage({ params }: NotePageProps) {
  // 验证会话
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const { id } = await params;
  const note = await getNote(id);

  if (!note) {
    notFound();
  }

  return (
    <NoteEditor
      id={id}
      initialContent={note.content}
      createdAt={note.metadata.createdAt}
      updatedAt={note.metadata.updatedAt}
    />
  );
}
