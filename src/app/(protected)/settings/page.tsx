import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getConfig } from "@/lib/config/manager";
import { UserList } from "@/components/settings/UserList";
import { loadMetadata } from "@/lib/fs/metadata";

export default async function SettingsPage() {
  const session = await getSession();
  if (session?.user.role !== "admin") redirect("/");

  const config = getConfig();
  const meta = await loadMetadata();
  const workspaces = meta.root.children?.filter((child) => child.type === "group") ?? [];

  return (
    <div className="p-6">
      <h1 className="mb-2 text-2xl font-bold">系统设置</h1>
      <p className="text-muted-foreground mb-6">管理用户账号和权限配置</p>
      <UserList initialUsers={config.users} availableWorkspaces={workspaces} />
    </div>
  );
}
