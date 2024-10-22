import { convertToCoreMessages, Message, streamText } from "ai";
import { z } from "zod";

import { customModel } from "@/ai2";
import { auth } from "@/app/(auth)/auth";

export async function POST(request: Request) {
  const { id, messages }: { id: string; messages: Array<Message> } =
    await request.json();

  const session = await auth();

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const coreMessages = convertToCoreMessages(messages);

  const result = await streamText({
    model: customModel,
    system:
      "you are a friendly assistant! keep your responses concise and helpful.",
    messages: coreMessages,
    maxSteps: 5,
    tools: {
      getWeather: {
        description: "Get the current weather at a location",
        parameters: z.object({
          latitude: z.number(),
          longitude: z.number(),
        }),
        execute: async ({ latitude, longitude }) => {
          const response = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m&hourly=temperature_2m&daily=sunrise,sunset&timezone=auto`,
          );

          const weatherData = await response.json();
          return weatherData;
        },
      },
    },
    onFinish: async ({ responseMessages }) => {
      if (session.user && session.user.id) {
        try {
          const response = await fetch(`${process.env.BACKEND_HOST}/api/v1/chats/`, {
            method: 'POST',
            headers: {
                accept: 'application/json',
                'Content-Type': 'application/json',
                // @ts-ignore
                Authorization: `Bearer ${session?.user?.accessToken}`
                  },
              body: JSON.stringify({
                id,
                messages: [...coreMessages, ...responseMessages],
                userId: session.user.id,
              })
          })

          if (!response.ok) {
            throw new Error("Failed to save chat");
          }
        } catch (error) {
          console.error("Failed to save chat");
        }
      }
    },
    experimental_telemetry: {
      isEnabled: true,
      functionId: "stream-text",
    },
  });

  return result.toDataStreamResponse({});
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return new Response("Not Found", { status: 404 });
  }

  const session = await auth();

  if (!session || !session.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const response = await fetch(
    `${process.env.BACKEND_HOST}/api/v1/chats/${id}`,
    {
      method: 'DELETE',
      headers: {
        accept: 'application/json',
          // @ts-ignore
          Authorization: `Bearer ${session.user.accessToken}`,
        },
      }
    );

    if (!response.ok) {
      return new Response("Unauthorized", { status: 401 });
    }

    return new Response("Chat deleted", { status: 200 });
  } catch (error) {
    return new Response("An error occurred while processing your request", {
      status: 500,
    });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return new Response("Not Found", { status: 404 });
  }

  const session = await auth();

  if (!session || !session.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const response = await fetch(
      `${process.env.BACKEND_HOST}/api/v1/chats/${id}`,
      {
        method: 'GET',
        headers: {
          accept: 'application/json',
          // @ts-ignore
          Authorization: `Bearer ${session.user.accessToken}`,
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return new Response("Chat not found", { status: 404 });
      }
      return new Response("Unauthorized", { status: 401 });
    }

    const chatData = await response.json();
    return new Response(JSON.stringify(chatData), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("Error fetching chat:", error);
    return new Response("An error occurred while processing your request", {
      status: 500,
    });
  }
}
