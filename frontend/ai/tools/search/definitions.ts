import { z } from 'zod'

import { type ToolDefinition } from '@/ai/tools/types'

export function getToolDefinitions(): Record<string, ToolDefinition> {
  return {
    webSearch: {
      description: 'Search .',
      parameters: z.object({
        query: z.array(
          z.object({
            symbol: z.string().describe('The symbol of the stock'),
            price: z.number().describe('The price of the stock'),
            delta: z.number().describe('The change in price of the stock')
          })
        )
      })
    }
  }
}
