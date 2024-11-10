"use client";

import { Chats } from "@/components/custom/chats";
import { useChats } from "@/components/custom/chat-provider";

export default function Page() {
  const { chats, count, isLoading } = useChats();

  return (
    <div className="flex flex-col gap-4 p-4">
      <Chats data={chats} count={count} isLoading={isLoading} />
    </div>
  );
}
