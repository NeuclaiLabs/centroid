import { getToolDefinitions } from '@/ai/tools/stocks/definitions'
import { getToolRenderers } from '@/ai/tools/stocks/renderers'
import { getToolUIComponents } from '@/ai/tools/stocks/ui'
import { getMutableAIState } from 'ai/rsc'

import {
  type ToolDefinition,
  type Tool
} from '@/ai/tools/types'

export function getTools(
  aiState: ReturnType<typeof getMutableAIState> | undefined
): Record<string, Tool> {
  const definitions = getToolDefinitions()
  const renderers = getToolRenderers(aiState)
  const components = getToolUIComponents()

  return Object.fromEntries(
    Object.entries(definitions).map(
      ([key, value]: [string, ToolDefinition]) => [
        key,
        {
          ...value,
          render: renderers[key]?.render,
          component: components[key]?.component
        }
      ]
    )
  )
}
