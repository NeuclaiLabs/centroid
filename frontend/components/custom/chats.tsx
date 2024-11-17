"use client";

import { formatDistanceToNow } from "date-fns";
import { MessageSquare, Trash } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useDeleteChat } from "@/lib/hooks/use-delete-chat";
import { Chat } from "@/lib/types";
import { getTitleFromChat } from "@/lib/utils";

interface ChatsProps {
  data: Chat[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  isValidating: boolean;
  count: number | undefined;
  mutate?: () => Promise<any>;
}

export function Chats({
  data,
  isLoading,
  isLoadingMore,
  hasMore,
  onLoadMore,
  isValidating,
  mutate,
  count,
}: ChatsProps) {
  const router = useRouter();
  const containerRef = React.useRef<HTMLDivElement>(null);

  const { deleteChat } = useDeleteChat(mutate);
  // Simplified intersection observer
  useEffect(() => {
    if (!hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isValidating) {
          onLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    const currentContainer = containerRef.current;
    if (currentContainer) {
      observer.observe(currentContainer);
    }

    return () => {
      if (currentContainer) {
        observer.unobserve(currentContainer);
      }
    };
  }, [hasMore, isValidating, onLoadMore]);

  const handleDelete = async (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation();
    await deleteChat(chatId);
  };

  return (
    <>
      <h1 className="text-2xl font-semibold mb-8">Chats</h1>

      <div className="space-y-4">
        {isLoading || count === undefined ? (
          <>
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4 p-4 rounded-lg border bg-card">
                <Skeleton className="size-10 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-5 w-[200px] mb-2" />
                  <Skeleton className="h-4 w-[150px]" />
                </div>
              </div>
            ))}
          </>
        ) : (
          <>
            <div className="text-sm text-muted-foreground">You have {count} conversations so far</div>
            {data?.map((chat) => (
              <div
                key={chat.id}
                onClick={() => router.push(`/chat/${chat.id}`)}
                className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-secondary/50 transition-colors cursor-pointer group"
              >
                <div className="size-10 rounded-full bg-secondary flex items-center justify-center">
                  <MessageSquare className="size-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg truncate">{getTitleFromChat(chat)}</h3>
                  <p className="text-sm text-muted-foreground">
                    Updated{" "}
                    {chat.updatedAt ? formatDistanceToNow(new Date(chat.updatedAt), { addSuffix: true }) : "Unknown"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => handleDelete(e, chat.id)}
                  >
                    <Trash className="size-4" />
                    <span className="sr-only">Delete chat</span>
                  </Button>
                  {/* <DropdownMenu modal={false}>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreVertical className="size-4" />
                            <span className="sr-only">More options</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => handleDelete(e, chat.id)}>Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu> */}
                </div>
              </div>
            ))}
            <div ref={containerRef} className="h-10 flex items-center justify-center">
              {isLoadingMore && hasMore && (
                <div className="animate-spin rounded-full size-6 border-b-2 border-primary" />
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
