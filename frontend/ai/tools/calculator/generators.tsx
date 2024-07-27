import { z } from 'zod'

import { Calculator } from '@/ai/tools/calculator/components'

import { getMutableAIState } from 'ai/rsc'
import { addToolMessages } from '@/ai/tools/utils'

import {
  BotCard,
  BotMessage,
  Stock,
  Purchase
} from '@/ai/tools/stocks/components'

import { auth } from '@/auth'

import { fetcher, nanoid } from '@/lib/utils'
import { getToolDefinitions } from './definitions'

import { type ToolRenderer } from '@/ai/tools/types'
import { TOOL } from '@/ai/tools/calculator/index'

export function getToolGenerators(
  aiState: ReturnType<typeof getMutableAIState> | undefined
): Record<string, ToolRenderer> {
  const toolDefinitions = getToolDefinitions()
  return {
    [TOOL]: {
      generate: async function* ({
        expression
      }: z.infer<typeof toolDefinitions.calculator.parameters>) {
        yield (
          <BotCard>
            <>Calculating...</>
          </BotCard>
        )
        const response = await fetcher(
          `${process.env.BACKEND_HOST}/api/v1/tool-calls/`,
          {
            method: 'POST',
            headers: {
              accept: 'application/json',
              'Content-Type': 'application/json',
              // @ts-ignore
              Authorization: `Bearer ${(await auth())?.user?.accessToken}`
            },
            body: JSON.stringify({
              kind: TOOL,
              chat_id: aiState?.get().chatId,
              model: aiState?.get().model,
              payload: {
                model: aiState?.get().model,
                args: {
                  expression: expression
                }
              }
            })
          }
        )
        const toolCallId = response.id
        addToolMessages(
          [
            {
              id: nanoid(),
              role: 'assistant',
              content: [
                {
                  type: 'tool-call',
                  toolName: TOOL,
                  toolCallId,
                  args: { expression }
                }
              ]
            },
            {
              id: nanoid(),
              role: 'tool',
              content: [
                {
                  type: 'tool-result',
                  toolName: TOOL,
                  toolCallId,
                  result: response.result
                }
              ]
            }
          ],
          aiState
        )

        return (
          <BotCard>
            <Calculator props={{"result": response.result.result}}  />
          </BotCard>
        )
      }
    }
  }
}
