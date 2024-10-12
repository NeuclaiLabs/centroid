import { getTools as getStockTools } from '@/ai/tools/stocks'
import { getTools as getCalculatorTools } from '@/ai/tools/calculator'
import { getMutableAIState } from 'ai/rsc/dist'
import { getTools as getSearchTools } from '@/ai/tools/search'

import { Tool } from './types'

export function getTools(
  aiState: ReturnType<typeof getMutableAIState> | undefined,
): Record<string, Tool> {
  return { ...getSearchTools(aiState), ...getStockTools(aiState), ...getCalculatorTools(aiState) }
}
