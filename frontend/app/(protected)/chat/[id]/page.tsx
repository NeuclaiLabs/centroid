import { CoreMessage } from "ai";
import { notFound } from "next/navigation";

import { auth } from "@/app/(auth)/auth";
import { Chat as PreviewChat } from "@/components/custom/chat";
import { Chat } from "@/lib/types";
import { convertToUIMessages } from "@/lib/utils";

export default async function Page({ params }: { params: any }) {
  const { id } = params;
  const session = await auth();

  if (!session || !session.user) {
    console.log("No session or user found");
    return notFound();
  }

  try {
    const response = await fetch(`${process.env.BACKEND_HOST}/api/v1/chats/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        // @ts-ignore
        Authorization: `Bearer ${session.user.accessToken}`,
      },
    });


    if (!response.ok) {
      if (response.status === 404) {
        console.log("Chat not found in API");
        return notFound();
      }
      throw new Error("Failed to fetch chat");
    }

    const chatFromApi = await response.json();

    // type casting
    const chat: Chat = {
      ...chatFromApi,
      messages: convertToUIMessages(chatFromApi.messages as Array<CoreMessage>),
    };

    if (session.user.id !== chat.userId) {
      // @ts-ignore
      console.log("User ID mismatch", session.user.id, chat.userId);
      return notFound();
    }

    return (
      <div className="flex flex-col h-[calc(100vh-4rem)]">
        <PreviewChat id={chat.id} project={chat.project} initialMessages={chat!.messages || []} />
      </div>
    );
  } catch (error) {
    console.error("Error fetching chat:", error);
    return notFound();
  }
}
