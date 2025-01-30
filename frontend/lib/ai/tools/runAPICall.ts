import { tool } from "ai";
import { z } from "zod";

export const runAPICall = tool({
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
  execute: async ({ endpoint, method, headers = {}, body, auth, queryParams, timeout, retry, allowedDomains }) => {
    try {
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
});
