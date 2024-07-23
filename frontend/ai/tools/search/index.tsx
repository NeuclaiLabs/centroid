import { getToolDefinitions } from '@/ai/tools/search/definitions'
import { getToolGenerators } from '@/ai/tools/search/generators'
import { getMutableAIState } from 'ai/rsc'

import { type ToolDefinition, type Tool } from '@/ai/tools/types'

import { Search } from '@/ai/tools/search/components'
import { type ToolUIComponent } from '@/ai/tools/types'

export function getTools(
  aiState: ReturnType<typeof getMutableAIState> | undefined
): Record<string, Tool> {
  const definitions = getToolDefinitions()
  const generators = getToolGenerators(aiState)
  const components: Record<string, ToolUIComponent> = {
    webSearch: {
      component: Search
    }
  }

  return Object.fromEntries(
    Object.entries(definitions).map(
      ([key, value]: [string, ToolDefinition]) => [
        key,
        {
          ...value,
          generate: generators[key]?.generate,
          component: components[key]?.component
        }
      ]
    )
  )
}
