"use client";

import { createContext, useContext, useState } from "react";
import useSWR, { mutate } from "swr";
import { useSession } from "next-auth/react";
import { fetcher } from "@/lib/utils";
import { Message } from "ai";

import { Chat } from "@/lib/types";


type ChatContextType = {
  chats: Chat[];
  isLoading: boolean;
  count: number;
  selectedChat: Chat | null;
  setSelectedChat: (chat: Chat | null) => void;
  deleteChat: (id: string) => Promise<void>;
  fetchChatHistory: (skip?: number, limit?: number) => Promise<void>;
  updateChat: (id: string, data: Partial<Chat>) => Promise<void>;
};

export const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);

  // Fetch chat history
  const { data: chatsData, isLoading } = useSWR(
    session?.user
      ? [`${process.env.NEXT_PUBLIC_BACKEND_HOST}/api/v1/chats/?skip=0&limit=5`, session.user.accessToken]
      : null,
    ([url, token]) => fetcher(url, token)
  );


  const fetchChatHistory = async (skip = 0, limit = 5) => {
    if (!session?.user) return;

    const url = `${process.env.NEXT_PUBLIC_BACKEND_HOST}/api/v1/chats/?skip=${skip}&limit=${limit}`;
    await mutate([url, session.user.accessToken]);
  };

  const updateChat = async (chatId: string, updateData: Partial<Chat>) => {
    if (!session?.user) return;

    const url = `${process.env.NEXT_PUBLIC_BACKEND_HOST}/api/v1/chats/${chatId}`;

    try {
      const updatedChat = await mutate(
        [url, session.user?.accessToken],
        async () => {
          const response = await fetcher(url, session.user?.accessToken, {
            method: "PUT",
            body: JSON.stringify(updateData),
          });
          return response;
        },
        {
          revalidate: true,
          populateCache: true,
        }
      );

      // Update selected chat if it's the one being edited
      if (selectedChat?.id === chatId) {
        setSelectedChat(updatedChat);
      }
    } catch (error) {
      console.error("Error updating chat:", error);
      throw error;
    }
  };

  const deleteChat = async (chatId: string) => {
    if (!session?.user) return;

    const url = `${process.env.NEXT_PUBLIC_BACKEND_HOST}/api/v1/chats/${chatId}`;
    try {
      await fetcher(url, session.user.accessToken, {
        method: "DELETE",
      });

      // Clear selected chat if it's the one being deleted
      if (selectedChat?.id === chatId) {
        setSelectedChat(null);
      }

      // Revalidate the chats list
      const chatsUrl = `${process.env.NEXT_PUBLIC_BACKEND_HOST}/api/v1/chats/?skip=0&limit=5`;
      await mutate([chatsUrl, session.user.accessToken]);
    } catch (error) {
      console.error("Error deleting chat:", error);
      throw error;
    }
  };

  return (
    <ChatContext.Provider
      value={{
        chats: chatsData?.data || [],
        isLoading,
        count: chatsData?.count,
        selectedChat,
        setSelectedChat,
        deleteChat,
        fetchChatHistory,
        updateChat,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChats() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChats must be used within a ChatProvider");
  }
  return context;
}
