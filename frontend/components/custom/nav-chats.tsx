"use client"

import {
  ChevronRightIcon,
  Folder,
  InfoIcon,
  MoreHorizontal,
  Share,
  Trash2,
  type LucideIcon,
} from "lucide-react"

import { useState } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

import { toast } from "sonner";
import useSWR from "swr";

import { Chat } from "@/db/schema";
import { fetcher } from "@/lib/utils";

import { useParams } from "next/navigation";
import { User } from "next-auth";
import { useSession } from "next-auth/react"

export function NavChats({
}) {
  const { data: session, status } = useSession()
  const user = session?.user
  const { id } = useParams();
  const { isMobile } = useSidebar()
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const {
    data: history,
    isLoading,
    mutate,
  } = useSWR<Array<Chat>>(user ? "/api/history" : null, fetcher, {
    fallbackData: [],
  });

  const handleDelete = async () => {
    const deletePromise = fetch(`/api/chat?id=${deleteId}`, {
      method: "DELETE",
    });

    toast.promise(deletePromise, {
      loading: "Deleting chat...",
      success: () => {
        mutate((history) => {
          if (history) {
            return history.filter((h) => h.id !== id);
          }
        });
        return "Chat deleted successfully";
      },
      error: "Failed to delete chat",
    });

    setShowDeleteDialog(false);
  };



  return (
    <>
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel className="text-foreground/50 text-sm">Recent chats</SidebarGroupLabel>
      <SidebarMenu>
        {!isLoading && history?.length === 0 && user ? (
            <div className="text-zinc-500 h-dvh w-full flex flex-row justify-center items-center text-sm gap-2">
              <InfoIcon />
              <div>No chats found</div>
            </div>
        ) : null}

        {/* {isLoading && user ? (
                    <div className="flex flex-col">
                      {[44, 32, 28, 52].map((item) => (
                        <div key={item} className="p-2 my-[2px]">
                          <div
                            className={`w-${item} h-[20px] rounded-md bg-zinc-200 dark:bg-zinc-600 animate-pulse`}
                          />
                        </div>
                      ))}
                    </div>
                  ) : null} */}

        {history && history?.map((chat) => (
          <SidebarMenuItem key={chat.id}>
            <SidebarMenuButton
              asChild
              className="hover:bg-[hsl(var(--sidebar-accent))] transition-colors"
            >
              <a href={`/chat/${chat.id}`} className="flex items-center gap-2 p-2 rounded-md">
                {/* <item.icon className="size-5" /> */}
              <span className="overflow-hidden whitespace-nowrap" style={{ textOverflow: "clip" }}>
                {chat.messages[0].content}
              </span>
              </a>
            </SidebarMenuButton>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuAction
                  showOnHover
                  className="hover:bg-[hsl(var(--sidebar-accent))] transition-colors rounded-md"
                >
                  <MoreHorizontal className="size-4 " />
                  <span className="sr-only text-sm">More</span>
                </SidebarMenuAction>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-48"
                side={isMobile ? "bottom" : "right"}
                align={isMobile ? "end" : "start"}
              >
                <DropdownMenuItem>
                  <Folder className="mr-2 size-4 text-muted-foreground" />
                  <span>View Project</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Share className="mr-2 size-4 text-muted-foreground" />
                  <span>Share Project</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Trash2 className="mr-2 size-4 text-muted-foreground" />
                  <span>Delete Project</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        ))}
        <SidebarMenuItem>
          <a href="#" className="flex items-center gap-2 p-2 text-sm text-foreground/50 hover:underline">
            <span>View More</span>
            <ChevronRightIcon className="size-4" />
          </a>
          {/* <SidebarMenuButton className="hover:bg-[hsl(var(--sidebar-accent))] transition-colors rounded-md">
            <MoreHorizontal className="size-5" />
            <span>More</span>
          </SidebarMenuButton> */}
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
<AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your
              chat and remove it from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
