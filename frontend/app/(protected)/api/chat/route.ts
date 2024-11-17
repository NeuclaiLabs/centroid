import { convertToCoreMessages, Message, streamText } from "ai";
import { z } from "zod";

import { customModel } from "@/ai2";
import { auth } from "@/app/(auth)/auth";
import { getToken } from "@/lib/utils";

export async function POST(request: Request) {
  const { id, messages, projectId }: { id: string; messages: Array<Message>; projectId: string | null } =
    await request.json();

  const session = await auth();

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const coreMessages = convertToCoreMessages(messages);

  // Fetch project prompt if projectId is provided
  let systemPrompt =
    "You are a helpful assistant. You should use the project files to help you answer the question. If you can't answer the question without the project files, say so.";
  if (projectId) {
    try {
      const promptResponse = await fetch(`${process.env.BACKEND_HOST}/api/v1/projects/${projectId}/prompt`, {
        headers: {
          Authorization: `Bearer ${getToken(session)}`,
        },
      });

      if (promptResponse.ok) {
        const { message } = await promptResponse.json();
        systemPrompt += message;
      }
    } catch (error) {
      console.error("Failed to fetch project prompt:", error);
    }
  }


  const result = await streamText({
    model: customModel,
    system: systemPrompt,
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
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m&hourly=temperature_2m&daily=sunrise,sunset&timezone=auto`
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
            method: "POST",
            headers: {
              accept: "application/json",
              "Content-Type": "application/json",
              Authorization: `Bearer ${getToken(session)}`,
            },
            body: JSON.stringify({
              id,
              messages: [...coreMessages, ...responseMessages],
              project_id: projectId,
            }),
          });

          if (!response.ok) {
            throw new Error("Failed to save chat");
          }
        } catch (error) {
          console.error("Failed to save chat");
        }
      }
    },
    experimental_telemetry: {
      isEnabled: false,
      functionId: "stream-text",
    },
  });

  return result.toDataStreamResponse({});
}
