import { z } from 'zod'

import { type ToolDefinition } from '@/ai/tools/types'
import { TOOL } from '@/ai/tools/calculator/index'
export function getToolDefinitions(): Record<string, ToolDefinition> {
  return {
    [TOOL]: {
      description:
        'Augments capabilities by utilizing calculator when necessary to do some math for responding to user queries.',
      parameters: z.object({
        expression: z
          .string()
          .describe(
            'Generate a concise and targeted math expression that accurately captures the intent of user and the key information they are seeking.'
          )
      })
    }
  }
}
