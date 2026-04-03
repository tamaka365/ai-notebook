import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getSession } from "@/lib/auth/session";
import { getConfig } from "@/lib/config/manager";
import { UserList } from "@/components/settings/UserList";
import { SystemConfigForm } from "@/components/settings/SystemConfigForm";
import { loadMetadata } from "@/lib/fs/metadata";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

export default async function SettingsPage() {
  const session = await getSession();
  if (session?.user.role !== "admin") redirect("/");

  const config = getConfig();
  const meta = await loadMetadata();
  const workspaces = meta.root.children?.filter((child) => child.type === "group") ?? [];

  return (
    <div className="p-6">
      <div className="mb-2 flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild className="-ml-2 px-2">
          <Link href="/">
            <ArrowLeft className="mr-1 h-4 w-4" />
            返回
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">系统设置</h1>
      </div>
      <p className="text-muted-foreground mb-6">管理系统配置和用户账号</p>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="users">用户管理</TabsTrigger>
          <TabsTrigger value="system">系统配置</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <UserList initialUsers={config.users} availableWorkspaces={workspaces} />
        </TabsContent>

        <TabsContent value="system">
          <SystemConfigForm initialPath={config.system.notesRootPath} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
