"use client";

import { LifeBuoy, Send, Shapes, Flag, Users } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import * as React from "react";
import useSWR from "swr";

import { NavChats } from "@/components/custom/nav-chats";
import { NavMain } from "@/components/custom/nav-main";
import { NavSecondary } from "@/components/custom/nav-secondary";
import { NavUser } from "@/components/custom/nav-user";
import { useTeams } from "@/components/custom/teams-provider";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Chat } from "@/db/schema";
import { fetcher } from "@/lib/utils";

import { OpenAstraIcon } from "./icons";

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Team",
      url: "/teams",
      icon: Users,
      isActive: false,
      // items: [
      //   {
      //     title: "History",
      //     url: "#",
      //   },
      //   {
      //     title: "Starred",
      //     url: "#",
      //   },
      //   {
      //     title: "Settings",
      //     url: "#",
      //   },
      // ],
    },
    {
      title: "Projects",
      url: "/projects",
      icon: Shapes,
      // items: [
      //   {
      //     title: "Genesis",
      //     url: "#",
      //   },
      //   {
      //     title: "Explorer",
      //     url: "#",
      //   },
      //   {
      //     title: "Quantum",
      //     url: "#",
      //   },
      // ],
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
  const { teams, currentTeam, isLoading: teamsIsLoading } = useTeams();

  // Retrieve chat history
  const {
    data: history,
    isLoading,
    mutate,
  } = useSWR<Array<Chat>>(user ? "/api/history" : null, fetcher, {
    fallbackData: [],
  });

  // Modify navMain data to include team ID from teams data
  const navMainWithTeamId = React.useMemo(() => {
    return data.navMain.map((item) =>
      item.title === "Team" ? { ...item, url: item.url + "/" + (currentTeam?.id ?? "") } : item
    );
  }, [currentTeam]);

  return (
    <Sidebar className="group-data-[side=left]:border-r-0 bg-sidebar text-sidebar-foreground" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild className="hover:bg-sidebar-accent transition-colors">
              <Link href="#">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700">
                  <OpenAstraIcon size={24} />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">OpenAstra</span>
                  <span className="truncate text-xs">Teams</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMainWithTeamId} />
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
