"use client"

import { BookOpen, LifeBuoy, Send, Shapes, Flag } from "lucide-react";
import * as React from "react";
import useSWR from "swr";

import { NavMain } from "@/components/custom/nav-main";
import { NavChats } from "@/components/custom/nav-chats";
import { NavSecondary } from "@/components/custom/nav-secondary";
import { NavUser } from "@/components/custom/nav-user";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { OpenAstraIcon } from "./icons";
import { fetcher } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { Chat } from "@/db/schema";

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Chat History",
      url: "#",
      icon: BookOpen,
      isActive: true,
      items: [
        {
          title: "History",
          url: "#",
        },
        {
          title: "Starred",
          url: "#",
        },
        {
          title: "Settings",
          url: "#",
        },
      ],
    },
    {
      title: "Projects",
      url: "#",
      icon: Shapes,
      items: [
        {
          title: "Genesis",
          url: "#",
        },
        {
          title: "Explorer",
          url: "#",
        },
        {
          title: "Quantum",
          url: "#",
        },
      ],
    },
    {
      title: "Feedback",
      url: "#",
      icon: Flag,
      items: [
        {
          title: "Introduction",
          url: "#",
        },
        {
          title: "Get Started",
          url: "#",
        },
        {
          title: "Tutorials",
          url: "#",
        },
        {
          title: "Changelog",
          url: "#",
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: "Support",
      url: "#",
      icon: LifeBuoy,
    },
    {
      title: "Feedback",
      url: "#",
      icon: Send,
    },
  ],
  projects: [
    {
      name: "Design Engineering",
      url: "#",
      icon: Shapes,
    },
    {
      name: "Sales & Marketing",
      url: "#",
      icon: Shapes,
    },
    {
      name: "Travel",
      url: "#",
      icon: Shapes,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = useSession();
  const user = session?.user;

  // Retrieve chat history
  const {
    data: history,
    isLoading,
    mutate,
  } = useSWR<Array<Chat>>(user ? "/api/history" : null, fetcher, {
    fallbackData: [],
  });

  return (
    <Sidebar
      variant="inset"
      className="bg-[hsl(var(--sidebar-background))] text-[hsl(var(--sidebar-foreground))]"
      {...props}
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              asChild
              className="hover:bg-[hsl(var(--sidebar-accent))] transition-colors"
            >
              <a href="#">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-[hsl(var(--sidebar-primary))] text-[hsl(var(--sidebar-primary-foreground))]">
                  <OpenAstraIcon size={16} />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">OpenAstra</span>
                  <span className="truncate text-xs">Teams</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        {/* Pass chats to NavChats */}
        <NavChats history={history || []} isLoading={isLoading} mutate={mutate} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
