import { useSession } from "next-auth/react";
import { toast } from "sonner";
import useSWRMutation from "swr/mutation";

import { fetcher, getToken } from "@/lib/utils";

export function useDeleteChat(onSuccess?: () => Promise<any>) {
  const { data: session } = useSession();
  const token = getToken(session);

  const { trigger } = useSWRMutation(
    [`${process.env.NEXT_PUBLIC_BACKEND_HOST}/api/v1/chats`, token],
    async ([url, token], { arg }: { arg: string }) => {
      const response = await fetcher(url + arg, token, { method: "DELETE" });

      return response;
    }
  );

  const deleteWithConfirmation = async (chatId: string) => {
    try {
      await trigger(chatId);
      await onSuccess?.();
      toast.success("Chat deleted successfully");
    } catch (error) {
      console.error("Error deleting chat:", error);
      toast.error("Failed to delete chat");
    }
  };

  return { deleteChat: deleteWithConfirmation };
}
