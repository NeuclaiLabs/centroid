"use client";

import React from 'react';
import { ChevronRightIcon, Folder, InfoIcon, MoreHorizontal, Share, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

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
} from "@/components/ui/dropdown-menu";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useChats } from "./chat-provider";
import { Skeleton } from '../ui/skeleton';
import { getTitleFromChat } from '@/lib/utils';

export function NavChats() {
  const { chats: history, count, isLoading, deleteChat } = useChats();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      await deleteChat(deleteId);
      toast.success("Chat deleted successfully");
    } catch (error) {
      toast.error("Failed to delete chat");
    }

    setShowDeleteDialog(false);
  };

  return (
    <>
      <SidebarGroup className="group-data-[collapsible=icon]:hidden">
        <SidebarGroupLabel className="text-foreground/50 text-sm">Recent chats</SidebarGroupLabel>
        <SidebarMenu>
          {isLoading && count === undefined ? (
            <>
              {[...Array(3)].map((_, i) => (
                <SidebarMenuItem key={`skeleton-${i}`}>
                  <div className="flex items-center gap-2 p-2">
                    <Skeleton className="h-4 w-[80%]" />
                  </div>
                </SidebarMenuItem>
              ))}
            </>
          ) : count === 0 ? (
            <div className="text-foreground h-[30dvh] w-full flex flex-row justify-center items-center text-sm gap-2">
              <InfoIcon />
              <div>No chats found</div>
            </div>
          ) : (
            history?.map((chat) => (
              <SidebarMenuItem key={chat.id}>
                <SidebarMenuButton asChild className="hover:bg-sidebar-accent transition-colors">
                  <Link href={`/chat/${chat.id}`} className="flex items-center gap-2 p-2 rounded-md">
                    <span className="overflow-hidden whitespace-nowrap" style={{ textOverflow: "clip" }}>
                      {getTitleFromChat(chat)}
                    </span>
                  </Link>
                </SidebarMenuButton>
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuAction showOnHover className="hover:bg-sidebar-accent transition-colors rounded-md">
                      <MoreHorizontal className="size-4 " />
                      <span className="sr-only text-sm">More</span>
                    </SidebarMenuAction>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-48" side="right" align="start">
                    <DropdownMenuItem>
                      <Folder className="mr-2 size-4 text-muted-foreground" />
                      <span>View Project</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Share className="mr-2 size-4 text-muted-foreground" />
                      <span>Share Project</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => {
                        setDeleteId(chat.id);
                        setShowDeleteDialog(true);
                      }}
                    >
                      <Trash2 className="mr-2 size-4 text-muted-foreground" />
                      <span>Delete Project</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuItem>
            ))
          )}

          {/* Show "View More" link only if there are messages */}
          {history && history.length > 0 && (
            <SidebarMenuItem>
              <Link href="#" className="flex items-center gap-2 p-2 text-sm text-foreground/50 hover:underline">
                <span>View More</span>
                <ChevronRightIcon className="size-4" />
              </Link>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarGroup>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your chat and remove it from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
