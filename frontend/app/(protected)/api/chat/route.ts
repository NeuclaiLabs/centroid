import { convertToCoreMessages, generateText, Message, streamText, generateObject } from "ai";
import { z } from "zod";

import { auth } from "@/app/(auth)/auth";
import { customModel } from "@/lib/ai";
import { getToken } from "@/lib/utils";
import type { Project } from "@/lib/types";
import { getWeather } from "@/lib/ai/tools/getWeather";
import { searchAPICollections } from "@/lib/ai/tools/searchAPICollections";
import { runAPICall } from "@/lib/ai/tools/runAPICall";

type AllowedTools =
  | "createDocument"
  | "updateDocument"
  | "requestSuggestions"
  | "getWeather"
  | "searchAPICollections"
  | "runAPICall";

const apiTools: AllowedTools[] = ["searchAPICollections", "runAPICall"];
const allTools: AllowedTools[] = ["createDocument", "updateDocument", "requestSuggestions", "getWeather", ...apiTools];

// Define schemas to match the collection format
const URLVariableSchema = z.object({
  key: z.string(),
  value: z.string().optional(),
});

const URLSchema = z.object({
  raw: z.string(),
  protocol: z.string().optional(),
  host: z.array(z.string()).optional(),
  path: z.array(z.string()).optional(),
  variable: z.array(URLVariableSchema).optional(),
});

const HeaderSchema = z.object({
  key: z.string(),
  value: z.string(),
});

const ResponseSchema = z.object({
  name: z.string().optional(),
  status: z.number().optional(),
  code: z.number().optional(),
  body: z.string().optional(),
  header: z.array(HeaderSchema).optional(),
});

const RequestSchema = z.object({
  method: z.string(),
  header: z.array(HeaderSchema).optional(),
  body: z
    .object({
      mode: z.string().optional(),
      raw: z.string().optional(),
    })
    .optional(),
  url: URLSchema,
});

export async function POST(request: Request) {
  const { id, messages, project }: { id: string; messages: Array<Message>; project: Project | null } =
    await request.json();

  const session = await auth();

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const coreMessages = convertToCoreMessages(messages);
  const llm = customModel(project!.model);

  const result = await streamText({
    model: llm,
    messages: [
      {
        role: "system",
        content: `You are an API documentation assistant.`,
      },
      ...coreMessages,
    ],
    maxSteps: 5,
    tools: {
      getWeather: getWeather,
      searchAPICollections: searchAPICollections(project!, session),
      runAPICall: runAPICall,
    },
    onFinish: async ({ responseMessages }) => {
      console.log("Response messages", responseMessages);
      if (session.user && session.user.id) {
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/chats/`, {
            method: "POST",
            headers: {
              accept: "application/json",
              "Content-Type": "application/json",
              Authorization: `Bearer ${getToken(session)}`,
            },
            body: JSON.stringify({
              id,
              messages: [...coreMessages, ...responseMessages],
              project_id: project?.id,
            }),
          });

          if (!response.ok) {
            throw new Error("Failed to save chat");
          }
        } catch (error) {
          console.error("Failed to save chat", error);
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
