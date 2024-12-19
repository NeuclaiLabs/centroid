import { convertToCoreMessages, Message, streamText } from "ai";
import { z } from "zod";

import { auth } from "@/app/(auth)/auth";
import { customModel } from "@/lib/ai";
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
      const promptResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/projects/${projectId}/prompt`, {
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
    model: customModel("gpt-4o-mini"),
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
      dynamicApiCall: {
        description: "Call a specified API with dynamic parameters",
        parameters: z.object({
          endpoint: z.string().url("Must be a valid URL"),
          method: z.enum(["GET", "POST", "PUT", "DELETE", "PATCH"]).default("GET"),
          headers: z.record(z.string()).optional().default({}),
          body: z.any().optional(),
          // Authentication-related parameters
          auth: z
            .object({
              type: z.enum(["bearer", "basic", "api_key", "none"]).default("none"),
              token: z.string().optional(),
              username: z.string().optional(),
              password: z.string().optional(),
              apiKey: z.string().optional(),
              apiKeyName: z.string().optional().default("x-api-key"),
            })
            .optional(),
          // Query parameters
          queryParams: z.record(z.string()).optional(),
          // Timeout in milliseconds
          timeout: z.number().min(1000).max(30000).default(5000),
          // Retry configuration
          retry: z
            .object({
              attempts: z.number().min(0).max(3).default(0),
              delay: z.number().min(100).max(5000).default(1000),
            })
            .optional(),
          // Allow/deny list for domains
          allowedDomains: z.array(z.string()).optional(),
        }),
        execute: async ({ endpoint, method, headers, body, auth, queryParams, timeout, retry, allowedDomains }) => {
          try {
            console.log("Executing API call", { endpoint, method, headers, body, auth, queryParams, timeout, retry, allowedDomains });
            // Domain validation
            if (allowedDomains?.length) {
              const url = new URL(endpoint);
              if (!allowedDomains.some((domain: string) => url.hostname.endsWith(domain))) {
                throw new Error(`Domain ${url.hostname} is not in the allowed list`);
              }
            }

            // Build authentication headers
            const authHeaders: Record<string, string> = {};
            if (auth) {
              switch (auth.type) {
                case "bearer":
                  if (auth.token) authHeaders["Authorization"] = `Bearer ${auth.token}`;
                  break;
                case "basic":
                  if (auth.username && auth.password) {
                    const credentials = btoa(`${auth.username}:${auth.password}`);
                    authHeaders["Authorization"] = `Basic ${credentials}`;
                  }
                  break;
                case "api_key":
                  if (auth.apiKey) {
                    authHeaders[auth.apiKeyName || "x-api-key"] = auth.apiKey;
                  }
                  break;
              }
            }

            // Build URL with query parameters
            const url = new URL(endpoint);
            if (queryParams) {
              Object.entries(queryParams).forEach(([key, value]) => {
                if (typeof value === "string") {
                  url.searchParams.append(key, value);
                } else {
                  throw new Error(`Query parameter value for ${key} is not a string`);
                }
              });
            }

            const startTime = Date.now();

            // Retry logic
            const makeRequest = async (attempt: number = 0): Promise<any> => {
              try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), timeout);

                const response = await fetch(url.toString(), {
                  method,
                  headers: { ...headers, ...authHeaders, "Content-Type": "application/json" },
                  body: body ? JSON.stringify(body) : undefined,
                  signal: controller.signal,
                });

                clearTimeout(timeoutId);

                const responseData = await response.json();
                const endTime = Date.now();
                const responseSize = JSON.stringify(responseData).length;

                return {
                  response: {
                    method,
                    args: {
                      ...queryParams,
                      ...(body && { body }),
                    },
                    data: responseData,
                    headers: Object.fromEntries(response.headers.entries()),
                  },
                  meta: {
                    status: response.status,
                    time: `${endTime - startTime}ms`,
                    size: `${(responseSize / 1024).toFixed(1)}KB`,
                  },
                };
              } catch (error) {
                if (retry && attempt < retry.attempts) {
                  await new Promise((resolve) => setTimeout(resolve, retry.delay));
                  return makeRequest(attempt + 1);
                }
                throw error;
              }
            };

            return await makeRequest();
          } catch (error) {
            return {
              response: {
                method,
                args: {},
                data: error instanceof Error ? error.message : "Failed to fetch data",
                headers: {},
              },
              meta: {
                status: 500,
                time: "0ms",
                size: "0KB",
              },
            };
          }
        },
      },
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
              project_id: projectId,
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
