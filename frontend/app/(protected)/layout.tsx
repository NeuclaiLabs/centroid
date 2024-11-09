"use client";

import { AppSidebar } from "@/components/custom/app-sidebar";
import { TeamsProvider } from "@/components/custom/teams-provider";
import { ProjectProvider, useProject } from "@/components/custom/project-provider";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChatBreadcrumbs } from "@/components/custom/chat";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <TeamsProvider>
      <ProjectProvider>
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset className="flex flex-col h-screen overflow-hidden">
            <Header />
            <div className="flex-1 overflow-auto">{children}</div>
          </SidebarInset>
        </SidebarProvider>
      </ProjectProvider>
    </TeamsProvider>
  );
}

function Header() {
  const pathname = usePathname();
  const showBreadcrumbs = pathname.startsWith('/chat/');

  return (
    <header className="flex h-16 shrink-0 items-center gap-0 w-full z-50 border-0">
      <div className="flex items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1" />
        {showBreadcrumbs && <ChatBreadcrumbs project={undefined} />}
      </div>
    </header>
  );
}
