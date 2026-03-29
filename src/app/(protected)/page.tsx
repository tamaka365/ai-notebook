import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";

export default async function HomePage() {
  return (
    <div className="flex h-screen flex-col">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-auto p-6">
          <div className="flex h-full items-center justify-center">
            <p className="text-muted-foreground">
              选择左侧文件开始编辑，或新建一个笔记
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
