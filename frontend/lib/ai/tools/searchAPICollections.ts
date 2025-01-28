import { tool } from "ai";
import { Session } from "next-auth";
import { z } from "zod";

import type { Project } from "@/lib/types";
import { getToken } from "@/lib/utils";

export const searchAPICollections = (project: Project, session: Session) =>
  tool({
    description:
      "Search and retrieve relevant API endpoints from the collection using natural language. Supports metadata filtering for method, url, has_auth, and has_body fields.",
    parameters: z.object({
      query: z.string().describe("Natural language description of the API endpoints you're looking for"),
      limit: z.number().min(1).max(20).default(5).describe("Maximum number of API definitions to return"),
      where: z
        .object({
          method: z
            .union([
              z.string(),
              z
                .object({
                  $eq: z.string(),
                  $ne: z.string(),
                  $in: z.array(z.string()),
                  $nin: z.array(z.string()),
                })
                .partial(),
            ])
            .optional(),
          url: z
            .union([
              z.string(),
              z
                .object({
                  $eq: z.string(),
                  $ne: z.string(),
                  $in: z.array(z.string()),
                  $nin: z.array(z.string()),
                })
                .partial(),
            ])
            .optional(),
          has_auth: z
            .union([
              z.boolean(),
              z
                .object({
                  $eq: z.boolean(),
                  $ne: z.boolean(),
                })
                .partial(),
            ])
            .optional(),
          has_body: z
            .union([
              z.boolean(),
              z
                .object({
                  $eq: z.boolean(),
                  $ne: z.boolean(),
                })
                .partial(),
            ])
            .optional(),
          $and: z.array(z.object({})).optional(),
          $or: z.array(z.object({})).optional(),
        })
        .optional()
        .describe(
          "Optional metadata filter conditions that will be inferred from your query. You can explicitly filter by HTTP method (GET, POST, etc.), URL patterns, authentication requirements, and request body requirements. Examples: 'Find all GET endpoints', 'Show authenticated endpoints', 'List endpoints that require a request body'"
        ),
    }),
    execute: async ({ query, limit, where }) => {
      const startTime = performance.now();
      try {
        const searchParams = new URLSearchParams({
          project_id: project.id,
          query: query,
          limit: limit.toString(),
        });

        if (where) {
          searchParams.append("where", JSON.stringify(where));
        }

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/files/search?${searchParams.toString()}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${getToken(session)}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Search failed with status: ${response.status}`);
        }

        const searchResult = await response.json();
        const endTime = performance.now();
        const duration = Math.round(endTime - startTime);
        console.log(`Total processing time: ${duration}ms`);
        console.log("Search results:", {
          results: JSON.stringify(searchResult),
          query,
          metadata: searchResult.metadata,
        });

        return {
          results: searchResult.results,
          success: true,
          query,
          metadata: searchResult.metadata,
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
              limit,
            },
          },
        };
      }
    },
  });
