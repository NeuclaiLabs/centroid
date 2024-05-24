import { getToolDefinitions } from '@/ai/tools/stocks/definitions'
import { getToolGenerators } from '@/ai/tools/stocks/generators'
import { getMutableAIState } from 'ai/rsc'

import { type ToolDefinition, type Tool } from '@/ai/tools/types'

import { Events, Stocks, Stock, Purchase } from '@/ai/tools/stocks/components'
import { type ToolUIComponent } from '@/ai/tools/types'


export function getStockTools(
  aiState: ReturnType<typeof getMutableAIState> | undefined
): Record<string, Tool> {
  const definitions = getToolDefinitions()
  const generators = getToolGenerators(aiState)
  const components: Record<string, ToolUIComponent> = {
    listStocks: {
      component: Stocks
    },
    showStockPrice: {
      component: Stock
    },
    showStockPurchase: {
      component: Purchase
    },
    getEvents: {
      component: Events
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
