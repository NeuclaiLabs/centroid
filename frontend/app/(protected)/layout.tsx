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
import Link from "next/link";
import { useChats } from "@/components/custom/chat-provider";

function ProjectBreadcrumb() {
  const { selectedProject } = useProject();
  const { selectedChat } = useChats();
  const project = selectedChat?.project ?? selectedProject;
  return (
    <BreadcrumbItem className="hidden md:block">
      <Link href={`/projects/${project?.id}`} passHref>
        {project?.title ?? "No Project Selected"}
      </Link>
    </BreadcrumbItem>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <TeamsProvider>
      <ProjectProvider>
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset className="flex flex-col h-screen overflow-hidden">
            <header className="flex h-16 shrink-0 items-center gap-0 w-full z-50 border-0">
              <div className="flex items-center gap-2 px-4">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 h-4" />
                <Breadcrumb>
                  <BreadcrumbList>
                    <ProjectBreadcrumb />
                    <BreadcrumbSeparator className="hidden md:block" />
                    <BreadcrumbItem>
                      <BreadcrumbPage>Data Fetching</BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
              </div>
            </header>
            <div className="flex-1 overflow-auto">{children}</div>
          </SidebarInset>
        </SidebarProvider>
      </ProjectProvider>
    </TeamsProvider>
  );
}
