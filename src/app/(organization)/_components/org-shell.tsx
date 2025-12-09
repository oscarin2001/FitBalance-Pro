"use client";
import * as React from "react";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { OrgSidebar } from "./org-sidebar";

export function OrgShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider defaultOpen>
      <OrgSidebar />
      <SidebarInset className="bg-background">
        <div className="flex min-h-svh flex-1 flex-col gap-6 p-6">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
