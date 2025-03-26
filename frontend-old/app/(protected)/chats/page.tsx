"use client";

import { useSession } from "next-auth/react";
import useSWRInfinite from "swr/infinite";

import { Chats } from "@/components/custom/chats";
import { Chat } from "@/lib/types";
import { fetcher, getToken } from "@/lib/utils";

interface ChatResponse {
  data: Chat[];
  count: number;
}

export default function ChatsPage() {
  const { data: session } = useSession();

  const getKey = (pageIndex: number, previousPageData: Chat[]) => {
    if (!session?.user || (previousPageData && !previousPageData.length)) return null;
    if (pageIndex === 0) {
      return [`${process.env.NEXT_PUBLIC_API_URL}/api/v1/chats/`, getToken(session)];
    }
    return [`${process.env.NEXT_PUBLIC_API_URL}/api/v1/chats/?skip=${pageIndex * 10}&limit=10`, getToken(session)];
  };

  const {
    data: pages,
    size,
    setSize,
    mutate,
    isLoading,
    isValidating,
  } = useSWRInfinite<ChatResponse>(getKey, ([url, token]) => fetcher(url, token as string), {
    revalidateFirstPage: false,
    revalidateOnFocus: false,
  });

  const chats = pages?.map((page) => page?.data).flat() || [];
  const isLoadingMore = isLoading;
  const hasMore = pages && pages[0] && pages[0].count > (pages.length || 0) * 10;
  return (
    <div className="relative flex flex-col min-h-screen bg-background">
      <div className="flex-1">
        <div className="max-w-6xl mx-auto p-6 md:px-32">
          <Chats
            data={chats}
            count={pages && pages[0] && pages[0].count}
            isLoading={isLoading}
            isLoadingMore={isLoadingMore}
            hasMore={hasMore}
            onLoadMore={() => setSize(size + 1)}
            isValidating={isValidating}
            mutate={mutate}
          />
        </div>
      </div>
    </div>
  );
}
