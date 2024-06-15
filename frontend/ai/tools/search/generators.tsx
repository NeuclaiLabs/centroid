import { z } from 'zod'

import { Search } from '@/ai/tools/search/components/search'

import { getMutableAIState } from 'ai/rsc'

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

export function getToolGenerators(
  aiState: ReturnType<typeof getMutableAIState> | undefined
): Record<string, ToolRenderer> {
  const toolDefinitions = getToolDefinitions()
  return {
    webSearch: {
      generate: async function* ({
        query
      }: z.infer<typeof toolDefinitions.search.parameters>) {
        yield (
          <BotCard>
            <>Searching...</>
          </BotCard>
        )
        const response = await fetch(`${process.env.BACKEND_HOST}/api/v1/actions/`, {
          method: 'POST',
          headers: {
            accept: 'application/json',
            'Content-Type': 'application/json',
            // @ts-ignore
            Authorization: `Bearer ${(await auth())?.user?.accessToken}`
          },
          body: JSON.stringify({
            "id": nanoid(),
            "kind": "web_search",
            "chat_id": aiState?.get().chatId,
            "payload": {
              "query": query
            }
          })
        })
        const res = await response.json()
        console.log(res['data'])
        const toolCallId = nanoid()
        aiState?.done({
          ...aiState.get(),
          messages: [
            ...aiState.get().messages,
            {
              id: nanoid(),
              role: 'assistant',
              content: [
                {
                  type: 'tool-call',
                  toolName: 'webSearch',
                  toolCallId,
                  args: { query }
                }
              ]
            },
            {
              id: nanoid(),
              role: 'tool',
              content: [
                {
                  type: 'tool-result',
                  toolName: 'webSearch',
                  toolCallId,
                  result: [{ description: query }]
                }
              ]
            }
          ]
        })

        return (
          <BotCard>
            <Search props={query} />
          </BotCard>
        )
      }
    }
  }
}
