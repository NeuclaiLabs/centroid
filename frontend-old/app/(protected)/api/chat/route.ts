import {
  convertToCoreMessages,
  experimental_createMCPClient,
  type Message,
  streamText,
  generateText,
  generateObject,
} from "ai";
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
  port: z.string().optional(),
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
  try {
    const { id, messages, project }: { id: string; messages: Array<Message>; project: Project | null } =
      await request.json();

    const session = await auth();

    if (!session) {
      return new Response("Unauthorized", { status: 401 });
    }

    const coreMessages = convertToCoreMessages(messages);
    const llm = customModel(project!.model);
    const client = await experimental_createMCPClient({
      transport: {
        type: "sse",
        url: "http://localhost:8000/mcp",
      },
    });

    const tools = await client.tools();
    console.log(JSON.stringify(project!.model, null, 2));
    const result = await streamText({
      model: llm,
      messages: [
        {
          role: "system",
          content: "You are helpful assistant.",
        },
        ...coreMessages,
      ],
      maxSteps: 1,
      tools: {
        getWeather: getWeather,
        // searchAPICollections: searchAPICollections(project, session),
        // runAPICall: runAPICall(project, session),
        ...tools,
      },
      onFinish: async (result) => {
        if (session?.user?.id) {
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
                messages: [...coreMessages, ...result.steps.flatMap((step) => step.messages || [])],
                project_id: project.id,
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
  } catch (error) {
    console.error("Error in chat route:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to process chat request",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
