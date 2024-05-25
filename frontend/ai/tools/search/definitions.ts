import { z } from 'zod'

import { type ToolDefinition } from '@/ai/tools/types'

export function getToolDefinitions(): Record<string, ToolDefinition> {
  return {
    webSearch: {
      description: 'Augments  capabilities by utilizing web search when necessary to better respond to user queries. It also helps with access to real-time events.',
      parameters: z.object({
        query: z.array(
          z.object({
            query: z
              .string()
              .describe(
                'Generate a concise and targeted search query that accurately captures the intent of user and the key information they are seeking. The search query should be designed to return the most relevant and useful results.'
              )
          })
        )
      })
    }
  }
}
