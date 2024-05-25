import { getStockTools } from '@/ai/tools/stocks'
import { getMutableAIState } from 'ai/rsc/dist'
import { getSearchTools } from '@/ai/tools/search'
import { Tool } from './types'

export function getTools(
  aiState: ReturnType<typeof getMutableAIState> | undefined
): Record<string, Tool> {
return { ...getSearchTools(aiState), ...getStockTools(aiState) }
}
