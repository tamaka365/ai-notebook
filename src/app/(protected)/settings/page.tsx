import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";

export default async function SettingsPage() {
  const session = await getSession();
  if (session?.user.role !== "admin") redirect("/");

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-bold">系统设置</h1>
      <p className="text-muted-foreground">
        用户管理和系统配置功能（后续步骤实现）
      </p>
    </div>
  );
}
