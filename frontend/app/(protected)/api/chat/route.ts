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
  const { id, messages, project }: { id: string; messages: Array<Message>; project: Project | null } =
    await request.json();

  const session = await auth();

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const coreMessages = convertToCoreMessages(messages);
  const llm = customModel(project!.model);
  console.log("Prompt instructions", project!.instructions);
  const result = await streamText({
    model: llm,
    messages: [
      {
        role: "system",
        content: `You are an API documentation assistant. Your primary tasks are:

1. Help users discover and understand API endpoints by using the searchAPICollections tool
2. Execute API calls using the runAPICall tool based on the context and user's request

When executing API calls:
- Analyze the available search results and select the most appropriate endpoint
- If no search results are available, use searchAPICollections to find the most relevant endpoint. And ask the user if they want to search for more endpoints or pick one from the list.
- Use runAPICall with the selected endpoint, following these body formatting rules:
  * For 'raw' mode: Format the body as a JSON string matching the endpoint's schema
  * For 'formdata' mode: Structure the body as key-value pairs compatible with FormData
  * For 'urlencoded' mode: Format as URLSearchParams with proper encoding
- Always validate the request body against the endpoint's specified schema before making the call
- After executing a tool, do not summarize or repeat the tool's response
- Explain to the user if their requested data format needs to be adjusted to match the endpoint's requirements

Always prioritize endpoints mentioned in the current conversation context. If multiple endpoints match, choose the one that best fits the user's specific request.

${project!.instructions}`,
      },
      ...coreMessages,
    ],
    maxSteps: 1,
    tools: {
      getWeather: getWeather,
      searchAPICollections: searchAPICollections(project!, session),
      runAPICall: runAPICall(project!, session),
    },
    onFinish: async ({ responseMessages }) => {
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
