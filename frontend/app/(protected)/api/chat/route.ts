import { convertToCoreMessages, Message, streamText, generateObject, generateText } from "ai";
import { z } from "zod";
import fs from "fs/promises";
import { homedir } from "os";

import { auth } from "@/app/(auth)/auth";
import { customModel } from "@/lib/ai";
import { getToken } from "@/lib/utils";
import type { Project } from "@/lib/types";

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

const ItemSchema = z.object({
  name: z.string(),
  request: RequestSchema,
  response: z.array(ResponseSchema).optional(),
});

const CollectionSchema = z.object({
  info: z.object({
    name: z.string(),
    schema: z.string().optional(),
  }),
  item: z.array(ItemSchema),
});

// Define the schema outside for better reusability
const APIMatchSchema = z.object({
  endpoint: z.string().describe("The full endpoint path"),
  method: z.string().describe("HTTP method (GET, POST, etc.)"),
  description: z.string().describe("Clear description of what the endpoint does"),
  relevanceScore: z.number().min(0).max(1).describe("Match relevance score between 0 and 1"),
  matchReasoning: z.string().describe("Explanation of why this endpoint matches the query"),
  requiredParameters: z.record(z.string()).describe("Map of parameter names to their descriptions"),
  examples: z
    .object({
      request: z.any().describe("Example request payload"),
      response: z.any().describe("Example response"),
    })
    .optional(),
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
        content: `You are an API documentation assistant. When using the listAPICalls function, respond with ONLY the message field from the response, which contains the success/failure status and time taken. Do not add any additional commentary or explanations.`,
      },
      ...coreMessages,
    ],
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
      listAPICalls: {
        description:
          "Search and retrieve relevant API endpoints from the collection using natural language. Returns raw results without requiring additional commentary.",
        parameters: z.object({
          query: z.string().describe("Natural language description of the API endpoints you're looking for"),
          limit: z.number().min(1).max(20).default(5).describe("Maximum number of API definitions to return"),
          includeExamples: z.boolean().default(true).describe("Whether to include example requests and responses"),
          categories: z.array(z.string()).optional().describe("Optional categories to filter by"),
        }),
        execute: async ({ query, limit, includeExamples, categories }) => {
          const startTime = performance.now();
          console.log("Start processing request");

          try {
            if (!project || !project.files) {
              throw new Error("No project or API definition files available");
            }

            // Filter for API definition files
            const apiFiles = Array.isArray(project.files)
              ? project.files.filter(
                  (file) => file.endsWith(".json") || file.endsWith(".yaml") || file.endsWith(".yml")
                )
              : [];

            if (apiFiles.length === 0) {
              throw new Error("No API definition files found in the project");
            }

            // Read content of each API definition file from .openastra/uploads
            const apiDefinitions = await Promise.all(
              apiFiles.map(async (file) => {
                try {
                  const content = await fs.readFile(`${homedir()}/.openastra/uploads/${file}`, "utf8");
                  return {
                    file,
                    content: JSON.parse(content),
                  };
                } catch (error) {
                  console.error(`Failed to read content for file: ${file}`, error);
                  return null;
                }
              })
            );

            // Filter out any failed fetches and combine all definitions
            const combinedDefinitions = apiDefinitions
              .filter((def) => def !== null)
              .map((def) => def.content)
              .flat();

            const generateTextStartTime = performance.now(); // Start time for generateText

            const { text } = await generateText({
              model: llm,
              prompt: `You are a precise API documentation tool. Analyze the following API endpoints and assign relevance scores based on the search query. Return the endpoints with their scores and reasoning.

Search criteria: "${query}"

Instructions:
1. Only include endpoints that exist in the collection
2. Assign a relevance score (0-1) to each endpoint
3. Provide brief reasoning for each score
4. Sort by relevance score descending
5. Return up to ${limit} matches

API Collection:
${JSON.stringify(combinedDefinitions, null, 2)}`,
              temperature: 0.0,
              maxTokens: 2000,
            });

            const generateTextEndTime = performance.now(); // End time for generateText
            console.log(`generateText call took ${Math.round(generateTextEndTime - generateTextStartTime)}ms`);

            const generateStartTime = performance.now(); // Start time for generateObject

            // Calculate relevance scores for each endpoint
            const { object: searchResult } = await generateObject({
              model: llm,
              schema: z.object({
                info: CollectionSchema.shape.info,
                item: z.array(
                  z.object({
                    ...ItemSchema.shape,
                    relevanceScore: z.number().min(0).max(1),
                    matchReasoning: z.string(),
                  })
                ),
              }),
              prompt: `You are a precise API documentation tool. Analyze the following API endpoints and assign relevance scores based on the search query. Return the endpoints with their scores and reasoning.

Search criteria: "${query}"

Instructions:
1. Only include endpoints that exist in the collection
2. Assign a relevance score (0-1) to each endpoint
3. Provide brief reasoning for each score
4. Sort by relevance score descending
5. Return up to ${limit} matches

API Collection:
${JSON.stringify(combinedDefinitions, null, 2)}`,
              temperature: 0.0,
              maxTokens: 2000,
            });

            const generateEndTime = performance.now(); // End time for generateObject
            console.log(`generateObject call took ${Math.round(generateEndTime - generateStartTime)}ms`);

            // Filter endpoints with relevance score > 0.9
            const filteredItems = searchResult.item.filter((endpoint) => endpoint.relevanceScore > 0.9);

            const endTime = performance.now();
            const duration = Math.round(endTime - startTime);
            console.log(`Total processing time: ${duration}ms`);

            return {
              message: `Successfully found ${filteredItems.length} matching endpoints in ${duration}ms`,
              results: { ...searchResult, item: filteredItems },
              success: true,
              query,
              metadata: {
                totalEndpoints: filteredItems.length,
                searchMethod: "Semantic search with relevance scoring",
                timestamp: new Date().toISOString(),
                searchParameters: {
                  includeExamples,
                  categories,
                  limit,
                },
              },
            };
          } catch (error) {
            const endTime = performance.now();
            const duration = Math.round(endTime - startTime);
            return {
              message: `Failed to search API definitions in ${duration}ms: ${error instanceof Error ? error.message : "Unknown error"}`,
              success: false,
              metadata: {
                totalEndpoints: 0,
                searchMethod: "Failed search",
                timestamp: new Date().toISOString(),
                searchParameters: {
                  includeExamples,
                  categories,
                  limit,
                },
              },
            };
          }
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
            console.log("Executing API call", {
              endpoint,
              method,
              headers,
              body,
              auth,
              queryParams,
              timeout,
              retry,
              allowedDomains,
            });
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
