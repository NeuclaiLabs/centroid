import { tool } from "ai";
import { Session } from "next-auth";
import { z } from "zod";

import type { Project } from "@/lib/types";

import { getToken } from "@/lib/utils";

export const runAPICall = (project: Project, session: Session) =>
  tool({
    description:
      "Select and execute an API endpoint from the available options. Choose the most appropriate endpoint based on the user's request and provide any required parameters.",
    parameters: z.object({
      request: z.object({
        method: z.string().describe("HTTP method for the request (GET, POST, PUT, DELETE, etc.)"),
        url: z.object({
          raw: z.string().optional().describe("Complete URL string"),
          port: z.string().optional().describe("Port number"),
          path: z.array(z.string()).optional().describe("URL path segments"),
          host: z.array(z.string()).optional().describe("Host segments"),
          query: z.array(z.record(z.any())).optional().describe("Query parameters"),
          variable: z.array(z.record(z.any())).optional().describe("URL variables"),
        }),
        header: z
          .array(
            z.object({
              key: z.string(),
              value: z.string(),
            })
          )
          .optional()
          .describe("Request headers"),
        body: z
          .object({
            mode: z.string().optional(),
            raw: z.string().optional(),
          })
          .optional()
          .describe("Request body"),
        name: z.string().optional().describe("Name of the request"),
        description: z.record(z.string()).optional().describe("Description of the request"),
        auth: z.record(z.any()).optional().describe("Authentication details"),
      }),
    }),
    execute: async ({ request }) => {
      try {
        // Capture start time
        const startTime = performance.now();

        // Log the incoming request
        console.log("[API Call] Request:", request);

        // Prepare the request URL with query parameters
        let url =
          request.url.host?.[0] + (request.url.port ? `:${request.url.port}` : "") + "/" + request.url.path?.join("/");

        // Ensure URL has proper protocol
        if (!url.startsWith("http://") && !url.startsWith("https://")) {
          url = `http://${url}`;
        }

        // Log the constructed URL for debugging
        console.log("[API Call] Constructed URL:", url);

        if (request.url.query) {
          const searchParams = new URLSearchParams(
            request.url.query.reduce((acc, query) => ({ ...acc, ...query }), {})
          );
          url = `${url}?${searchParams.toString()}`;
        }

        // Log the final URL
        console.log("[API Call] Final URL:", url, request.method);

        // Execute the API call
        const apiResponse = await fetch(url, {
          method: request.method,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken(session)}`,
            ...(request.header?.reduce((acc, header) => ({ ...acc, [header.key]: header.value }), {}) ?? {}),
          },
          ...(request.body?.raw && { body: request.body.raw }),
        });

        const data = await apiResponse.json();
        const responseSize = JSON.stringify(data).length;

        // Log successful response
        console.log("[API Call] Response:", {
          status: apiResponse.status,
          size: `${(responseSize / 1024).toFixed(1)}KB`,
          data: data,
        });

        return {
          response: {
            method: request.method,
            args: request.url.query?.[0] || {},
            data: JSON.stringify(data),
            headers: Object.fromEntries(apiResponse.headers.entries()),
          },
          meta: {
            status: apiResponse.status,
            time: `${(performance.now() - startTime).toFixed(1)}ms`,
            size: `${(responseSize / 1024).toFixed(1)}KB`,
          },
        };
      } catch (error) {
        // Log error details
        console.error("[API Call] Error:", {
          message: error instanceof Error ? error.message : "Unknown error",
          error: error,
        });

        return {
          response: {
            method: request.method,
            args: {},
            data: JSON.stringify({
              success: false,
              message: error instanceof Error ? error.message : "Unknown error",
            }),
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
