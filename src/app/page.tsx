import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";

export default async function Home() {
  const session = await getSession();
  if (session) {
    // 后续步骤实现 /notes 页面
    redirect("/notes");
  }
  redirect("/login");
}
