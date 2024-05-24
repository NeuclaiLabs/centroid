import { getStockTools } from '@/ai/tools/stocks'
import { getMutableAIState } from 'ai/rsc/dist'
import { Tool } from './types'

export function getTools(
  aiState: ReturnType<typeof getMutableAIState> | undefined
): Record<string, Tool> {
  return getStockTools(aiState)
}
