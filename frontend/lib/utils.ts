import { CoreMessage, CoreToolMessage, generateId, Message, ToolInvocation } from "ai";
import { clsx, type ClassValue } from "clsx";
import { redirect } from "next/navigation";
import { Session } from "next-auth";
import { signOut } from "next-auth/react";
import { twMerge } from "tailwind-merge";

import { Chat } from "@/lib/types";
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ApplicationError extends Error {
  info: string;
  status: number;
}

export const fetcher = async (
  url: string,
  token?: string,
  options?: {
    method: string;
    headers?: { "Content-Type": string };
    body?: string;
  }
) => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    method: options?.method || "GET",
    headers,
    ...(options?.body && { body: options.body }),
  });

  if (!res.ok) {
    if (res.status === 401) {
      // Sign out and redirect to sign-in page
      await signOut({ redirect: false });
      redirect("/sign-in");
    }

    const error = new Error("An error occurred while fetching the data.") as ApplicationError;
    error.info = await res.json();
    error.status = res.status;
    throw error;
  }

  return res.json();
};

export function getLocalStorage(key: string) {
  if (typeof window !== "undefined") {
    return JSON.parse(localStorage.getItem(key) || "[]");
  }
  return [];
}

export function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function addToolMessageToChat({
  toolMessage,
  messages,
}: {
  toolMessage: CoreToolMessage;
  messages: Array<Message>;
}): Array<Message> {
  return messages.map((message) => {
    if (message.toolInvocations) {
      return {
        ...message,
        toolInvocations: message.toolInvocations.map((toolInvocation) => {
          const toolResult = toolMessage.content.find((tool) => tool.toolCallId === toolInvocation.toolCallId);
          if (toolResult) {
            return {
              ...toolInvocation,
              state: "result",
              result: toolResult.result,
            };
          }
          return toolInvocation;
        }),
      };
    }
    return message;
  });
}

export function convertToUIMessages(messages: Array<CoreMessage>): Array<Message> {
  return messages.reduce((chatMessages: Array<Message>, message) => {
    if (message.role === "tool") {
      return addToolMessageToChat({
        toolMessage: message as CoreToolMessage,
        messages: chatMessages,
      });
    }
    let textContent = "";
    let toolInvocations: Array<ToolInvocation> = [];
    if (typeof message.content === "string") {
      textContent = message.content;
    } else if (Array.isArray(message.content)) {
      for (const content of message.content) {
        if (content.type === "text") {
          textContent += content.text;
        } else if (content.type === "tool-call") {
          toolInvocations.push({
            state: "call",
            toolCallId: content.toolCallId,
            toolName: content.toolName,
            args: content.args,
          });
        }
      }
    }
    chatMessages.push({
      id: generateId(),
      role: message.role,
      content: textContent,
      toolInvocations,
    });
    return chatMessages;
  }, []);
}
export function getTitleFromChat(chat: Chat) {
  const messages = convertToUIMessages(chat.messages as Array<CoreMessage>);
  const firstMessage = messages[0];
  if (!firstMessage) {
    return "Untitled";
  }
  return firstMessage.content;
}

export function getToken(session: Session | null) {
  return (session?.user as any)?.accessToken as string;
}
