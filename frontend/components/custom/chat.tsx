"use client";

import { Attachment, Message } from "ai";
import { useChat } from "ai/react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState, useEffect, useRef } from "react";
import useSWR from "swr";

import { PreviewMessage, ThinkingMessage } from "@/components/custom/message";
import { MultimodalInput } from "@/components/custom/multimodal-input";
import { useProject } from "@/components/custom/project-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { fetcher, getToken } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

import { Project } from "./project";
import ProjectChats from "./project-chats";

import type { Project as ProjectType } from "@/lib/types";

// Hook for scrolling to the bottom of the chat
const useScrollToBottom = () => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const isInputting = useRef(false);

  const scrollToBottom = () => {
    // Don't scroll if user is inputting while scrolled up
    if (shouldAutoScroll && !isInputting.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
    }
  };

  useEffect(() => {
    const options = {
      root: null,
      rootMargin: "0px",
      threshold: 1.0,
    };

    const observer = new IntersectionObserver((entries) => {
      const [entry] = entries;
      setShouldAutoScroll(entry.isIntersecting);
    }, options);

    if (messagesEndRef.current) {
      observer.observe(messagesEndRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Method to call when user starts/stops typing
  const setIsInputting = (typing: boolean) => {
    isInputting.current = typing;
  };

  return [messagesEndRef, scrollToBottom, setIsInputting] as const;
};

export function Chat({
  id,
  project,
  initialMessages,
}: {
  id: string;
  project: ProjectType | undefined;
  initialMessages: Array<Message>;
}) {
  const { data: session } = useSession();
  const { mutate: mutateHistory } = useSWR(
    session?.user ? [`${process.env.NEXT_PUBLIC_API_URL}/api/v1/chats/`, getToken(session)] : null,
    ([url, token]) => fetcher(url, token as string)
  );
  const { selectedProject, setSelectedProjectId } = useProject();
  const { messages, handleSubmit, input, setInput, append, isLoading, stop } = useChat({
    body: { id, projectId: project?.id || selectedProject?.id },
    initialMessages,
    onFinish: () => {
      window.history.replaceState({}, "", `/chat/${id}`);
    },
  });

  const [messagesEndRef, scrollToBottom, setIsInputting] = useScrollToBottom();
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
        const chatExists = currentHistory?.data?.some((chat: any) => chat.id === id);
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

  useEffect(() => {
    if (project) {
      // Update the current project when the chat loads
      setSelectedProjectId(project.id);
    }
  }, [project, setSelectedProjectId]);

  const path = usePathname();
  const isOnProjectPage = path.includes("/projects");

  // Add new state to track if user is at bottom
  const [isAtBottom, setIsAtBottom] = useState(true);

  // Add scroll event listener to check scroll position
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsAtBottom(entry.isIntersecting);
      },
      {
        root: null,
        rootMargin: "100px", // This creates a margin around the target
        threshold: 0, // Trigger as soon as even one pixel is visible
      }
    );
    console.log("Is at bottom", isAtBottom);
    if (messagesEndRef.current) {
      observer.observe(messagesEndRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div className="relative flex flex-col h-screen bg-background">
      {messages.length === 0 && !isOnProjectPage ? (
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
      ) : messages.length === 0 && isOnProjectPage ? (
        <>
          <div className="flex flex-col md:flex-row w-full max-w-5xl mx-auto p-4">
            <Card className="w-full md:w-[65%] p-4 md:p-8 md:pt-0 space-y-6 md:space-y-8 bg-background border-none shadow-none">
              <form className="flex flex-col w-full space-y-4" onSubmit={handleSubmit}>
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
                <ProjectChats projectId={project?.id ?? ""} />
              </form>
            </Card>
            <div className="w-full md:w-[35%] pl-0 mt-0">
              <Project isLoading={isLoading} data={selectedProject ?? undefined} />
            </div>
          </div>
        </>
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

          <div className="sticky bottom-0 w-full  ">
            <div className="max-w-3xl mx-auto p-4 md:p-6">
              {messages.length !== 0 && !isAtBottom && (
                <Button
                  variant="outline"
                  size="icon"
                  className="relative  left-1/2 -translate-x-1/2 bottom-1 rounded-full z-10 bg-background/80 backdrop-blur-sm"
                  onClick={() => messagesEndRef.current?.scrollIntoView({ behavior: "auto" })}
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
              )}
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
