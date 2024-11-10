"use client";

import { createContext, useContext, useState, useEffect, useMemo } from "react";
import useSWR, { mutate } from "swr";
import { useSession } from "next-auth/react";
import { fetcher, getToken } from "@/lib/utils";

import { Chat } from "@/lib/types";


type ChatContextType = {
  chats: Chat[];
  isLoading: boolean;
  isLoadingChat: boolean;
  count: number | undefined;
  selectedChat: Chat | null;
  error: Error | null;
  setSelectedChatId: (id: string | null) => void;
  deleteChat: (id: string) => Promise<void>;
  fetchChatHistory: (skip?: number, limit?: number) => Promise<void>;
  updateChat: (id: string, data: Partial<Chat>) => Promise<void>;
  fetchChatById: (id: string) => Promise<Chat | null>;
};

export const ChatContext = createContext<ChatContextType | undefined>(undefined);

const BASE_API_URL = `${process.env.NEXT_PUBLIC_BACKEND_HOST}/api/v1/chats`;
const getChatsUrl = (skip = 0, limit = 5) => `${BASE_API_URL}/?skip=${skip}&limit=${limit}`;
const getChatUrl = (chatId: string) => `${BASE_API_URL}/${chatId}`;

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Fetch chat history
  const { data: chatsData, isLoading, error: swrError } = useSWR<{ data: Chat[]; count: number }>(
    session?.user
      ? [getChatsUrl(), getToken(session)]
      : null,
    ([url, token]) => fetcher(url, token as string)
  );


  const fetchChatHistory = async (skip = 0, limit = 5) => {
    if (!session?.user) return;
    await mutate([getChatsUrl(skip, limit), getToken(session)]);
  };

  const updateChat = async (chatId: string, updateData: Partial<Chat>) => {
    if (!session?.user) return;
    const url = getChatUrl(chatId);

    try {
      const updatedChat = await mutate(
        [url, getToken(session)],
        async () => {
          const response = await fetcher(url, getToken(session), {
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
    const url = getChatUrl(chatId);
    try {
      await fetcher(url, getToken(session), {
        method: "DELETE",
      });

      // Clear selected chat if it's the one being deleted
      if (selectedChat?.id === chatId) {
        setSelectedChat(null);
      }

      // Revalidate the chats list
      const chatsUrl = getChatsUrl();
      await mutate([chatsUrl, getToken(session)]);
    } catch (error) {
      console.error("Error deleting chat:", error);
      throw error;
    }
  };

  const fetchChatById = async (chatId: string): Promise<Chat | null> => {
    if (!session?.user) return null;
    const url = getChatUrl(chatId);
    try {
      const response = await fetcher(url, getToken(session));
      if (!response || !response.data) {
        console.error("Invalid chat response:", response);
        throw new Error("Invalid chat data received");
      }
      return response.data;
    } catch (error) {
      console.error(`Error fetching chat ${chatId}:`, error);
      return null;
    }
  };

  // Effect to update selected chat when ID changes
  useEffect(() => {
    let mounted = true;

    const updateSelectedChat = async () => {
      if (!mounted) return;
      setError(null);

      if (!selectedChatId) {
        setSelectedChat(null);
        return;
      }

      const chatInList = chatsData?.data?.find(
        (c: Chat) => c.id === selectedChatId
      );

      if (chatInList) {
        setSelectedChat(chatInList);
        return;
      }

      // If not in list, fetch it directly
      setIsLoadingChat(true);
      try {
        const fetchedChat = await fetchChatById(selectedChatId);
        if (fetchedChat) {
          setSelectedChat(fetchedChat);
        } else {
          setError(new Error(`Chat ${selectedChatId} not found`));
          setSelectedChat(null);
        }
      } catch (err) {
        console.error("Error in updateSelectedChat:", err);
        setError(err instanceof Error ? err : new Error('Failed to fetch chat'));
        setSelectedChat(null);
      } finally {
        setIsLoadingChat(false);
      }
    };

    updateSelectedChat();
    return () => {
      mounted = false;
    };
  }, [selectedChatId, chatsData?.data]);

  // Memoize context value
  const contextValue = useMemo(
    () => ({
      chats: chatsData?.data || [],
      isLoading,
      isLoadingChat,
      count: chatsData?.count,
      selectedChat,
      error: error || swrError,
      setSelectedChatId,
      deleteChat,
      fetchChatHistory,
      updateChat,
      fetchChatById,
    }),
    [chatsData, isLoading, isLoadingChat, selectedChat, error, swrError]
  );

  return (
    <ChatContext.Provider value={contextValue}>
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
