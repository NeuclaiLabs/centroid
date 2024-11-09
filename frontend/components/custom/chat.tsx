"use client";

import { Attachment, Message } from "ai";
import { useChat } from "ai/react";
import { useState, useEffect, useRef } from "react";
import useSWR from "swr";

import { PreviewMessage, ThinkingMessage } from "@/components/custom/message";
import { MultimodalInput } from "@/components/custom/multimodal-input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useSession } from "next-auth/react";
import { fetcher } from "@/lib/utils";

// Hook for scrolling to the bottom of the chat
const useScrollToBottom = () => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
  };

  return [messagesEndRef, scrollToBottom] as const;
};

export function Chat({ id, initialMessages }: { id: string; initialMessages: Array<Message> }) {
  const { data: session } = useSession();
  const { mutate: mutateHistory } = useSWR(
    session?.user
      ? [`${process.env.NEXT_PUBLIC_BACKEND_HOST}/api/v1/chats/?skip=0&limit=5`, session.user.accessToken]
      : null,
    ([url, token]) => fetcher(url, token as string)
  );
  const { messages, handleSubmit, input, setInput, append, isLoading, stop } = useChat({
    body: { id },
    initialMessages,
    onFinish: () => {
      window.history.replaceState({}, "", `/chat/${id}`);
    },
  });

  const [messagesEndRef, scrollToBottom] = useScrollToBottom();
  const [attachments, setAttachments] = useState<Array<Attachment>>([]);
  const suggestions = [
    "Generate a multi-step onboarding flow",
    "How can I schedule cron jobs?",
    "Write code to implement a min heap",
  ];

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Move the history update logic outside useChat
  useEffect(() => {
    if (messages.length == 1) {
      mutateHistory((currentHistory: { data: any; count: number }) => {
        if (!currentHistory) return currentHistory;

        // Check if chat already exists in history
        const chatExists = currentHistory?.data?.some((chat) => chat.id === id);
        if (chatExists) return currentHistory;

        // Add new chat to history
        const newChat: any = {
          id,
          messages: messages,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        return { data: [newChat, ...currentHistory.data], count: currentHistory.count + 1 };
      }, false);
    }
  }, [id, messages, mutateHistory]);

  return (
    <div className="relative flex flex-col h-screen bg-background">
      {messages.length === 0 ? (
        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="w-full max-w-3xl mx-auto p-4 md:p-8 space-y-6 md:space-y-8 bg-background border-none shadow-none">
            <h1 className="text-3xl md:text-5xl font-bold text-center break-words">What can I help you with?</h1>
            <form className="flex flex-col items-center w-full space-y-4" onSubmit={handleSubmit}>
              <div className="w-full">
                <MultimodalInput
                  input={input}
                  setInput={setInput}
                  handleSubmit={handleSubmit}
                  isLoading={isLoading}
                  stop={stop}
                  attachments={attachments}
                  setAttachments={setAttachments}
                  messages={messages}
                  append={append}
                />
              </div>

              <div className="flex flex-wrap justify-center gap-2 pb-20 md:pb-40">
                {suggestions.map((suggestion, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="text-xs px-2 py-1 h-auto"
                    onClick={() => setInput(suggestion)}
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            </form>
          </Card>
        </div>
      ) : (
        <>
          <div className="flex-1 ">
            <div className="max-w-3xl mx-auto p-4 md:py-8">
              {messages.map((message, index) => (
                <div
                  key={`${message.id || `${id}-${index}`}`}
                  className="mb-4 break-words overflow-hidden message-container"
                >
                  <PreviewMessage isLoading={isLoading} message={message} chatId={id} vote={undefined} />
                </div>
              ))}
              {isLoading && messages.length > 0 && messages[messages.length - 1].role === "user" && <ThinkingMessage />}
              <div ref={messagesEndRef} />
            </div>
          </div>

          <div className="sticky bottom-0 w-full bg-background/80 backdrop-blur-sm border-t">
            <div className="max-w-3xl mx-auto p-4 md:p-6">
              <form className="flex flex-col sm:flex-row gap-2 relative items-end w-full">
                <MultimodalInput
                  input={input}
                  setInput={setInput}
                  handleSubmit={handleSubmit}
                  isLoading={isLoading}
                  stop={stop}
                  attachments={attachments}
                  setAttachments={setAttachments}
                  messages={messages}
                  append={append}
                />
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
