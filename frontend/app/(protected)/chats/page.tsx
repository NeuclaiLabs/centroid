"use client";

import { Chat } from "@/lib/types";
import { fetcher } from "@/lib/utils";
import useSWR from "swr";
export default function Page() {
  // const { chats, count, isLoading } = useChats();
  const { data: chatsData, isLoading } = useSWR<{ data: Chat[]; count: number }>(
    `${process.env.NEXT_PUBLIC_BACKEND_HOST}/api/v1/chats/?skip=0&limit=5`,
    fetcher
  );

  return (
    <div className="flex flex-col gap-4 p-4">
      <Chats data={chatsData?.data} count={chatsData?.count} isLoading={isLoading} />
    </div>
  );
}
