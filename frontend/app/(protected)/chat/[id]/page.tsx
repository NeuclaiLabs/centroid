import { CoreMessage, CoreToolMessage, Message, ToolInvocation } from "ai";
import { notFound } from "next/navigation";

import { auth } from "@/app/(auth)/auth";
import { Chat as PreviewChat } from "@/components/custom/chat";
import { getChatById } from "@/db/queries";
import { Chat } from "@/db/schema";
import { generateUUID } from "@/lib/utils";

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
          const toolResult = toolMessage.content.find(
            (tool) => tool.toolCallId === toolInvocation.toolCallId,
          );

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

function convertToUIMessages(messages: Array<CoreMessage>): Array<Message> {
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
      id: generateUUID(),
      role: message.role,
      content: textContent,
      toolInvocations,
    });

    return chatMessages;
  }, []);
}

export default async function Page({ params }: { params: any }) {
  const { id } = params;
  const session = await auth();

  if (!session || !session.user) {
    console.log("No session or user found");
    return notFound();
  }

  try {
    console.log(`Fetching chat with ID: ${id}`);
    const response = await fetch(`${process.env.BACKEND_HOST}/api/v1/chats/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // @ts-ignore
        Authorization: `Bearer ${session.user.accessToken}`,
      },
    });


    if (!response.ok) {
      if (response.status === 404) {
        console.log("Chat not found in API");
        return notFound();
      }
      throw new Error('Failed to fetch chat');
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

    return  (
      <div className="flex flex-col gap-4 p-4 pb-0">
        <PreviewChat id={chat.id} initialMessages={chat.messages} />
      </div>
    );
  } catch (error) {
    console.error("Error fetching chat:", error);
    return notFound();
  }
}
