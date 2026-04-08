"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";

export function Header() {
  return (
    <header className="flex h-14 items-center px-4 md:hidden">
      <div className="flex items-center gap-2">
        <SidebarTrigger />
        <span className="font-semibold">AI Notebook</span>
      </div>
    </header>
  );
}
