import { toast } from "sonner";
import useSWRMutation from "swr/mutation";
import { fetcher, getToken } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { Chat } from "@/lib/types";

export function useDeleteChat(onSuccess?: () => Promise<any>) {
  const { data: session } = useSession();
  const { trigger } = useSWRMutation(
    '/api/v1/chats',
    async (url: string, { arg }: { arg: string }) => {
      const token = getToken(session);
      const response = await fetcher(
        `${process.env.NEXT_PUBLIC_BACKEND_HOST}/api/v1/chats/${arg}`,
        token,
        { method: 'DELETE' }
      );
      return response;
    },
    {
      onSuccess: async (data, key, config) => {
        await onSuccess?.();
      },
      populateCache: (result, currentData) => {
        if (!currentData) return currentData;
        return {
          ...currentData,
          items: currentData.items.filter((chat: Chat) => chat.id !== result.id),
          count: currentData.count - 1
        };
      },
      revalidate: false
    }
  );

  const deleteWithConfirmation = async (chatId: string) => {
    try {
      await trigger(chatId);
      toast.success('Chat deleted successfully');
    } catch (error) {
      console.error('Error deleting chat:', error);
      toast.error('Failed to delete chat');
    }
  };

  return { deleteChat: deleteWithConfirmation };
}
