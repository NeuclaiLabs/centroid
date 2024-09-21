import { getToolDefinitions } from '@/ai/tools/calculator/definitions'
import { getToolGenerators } from '@/ai/tools/calculator/generators'
import { getMutableAIState } from 'ai/rsc'

import { type ToolDefinition, type Tool } from '@/ai/tools/types'

import { Calculator } from '@/ai/tools/calculator/components'
import { type ToolUIComponent } from '@/ai/tools/types'

export const TOOL = "calculator"

export function getTools(
  aiState: ReturnType<typeof getMutableAIState> | undefined
): Record<string, Tool> {
  const definitions = getToolDefinitions()
  const generators = getToolGenerators(aiState)
  const components: Record<string, ToolUIComponent> = {
    [TOOL]: {
      component: Calculator
    }
  }

  return Object.fromEntries(
    Object.entries(definitions).map(
      ([key, value]: [string, ToolDefinition]) => [
        key,
        {
          ...value,
          generate: generators[key]?.generate,
          component: components[key]?.component,
          settings: null
        }
      ]
    )
  )
}
