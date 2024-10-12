import { z } from 'zod'

import { EventsSkeleton } from '@/ai/tools/stocks/components/events-skeleton'
import { Events } from '@/ai/tools/stocks/components/events'
import { StocksSkeleton } from '@/ai/tools/stocks/components/stocks-skeleton'
import { Stocks } from '@/ai/tools/stocks/components/stocks'
import { StockSkeleton } from '@/ai/tools/stocks/components/stock-skeleton'
import { Search } from '@/ai/tools/search/components/search'

import { getMutableAIState } from 'ai/rsc'
import { auth } from '@/auth'

import {
  BotCard,
  BotMessage,
  Stock,
  Purchase
} from '@/ai/tools/stocks/components'

import { sleep, nanoid } from '@/lib/utils'
import { getToolDefinitions } from './definitions'

import { type ToolRenderer } from '@/ai/tools/types'

export function getToolGenerators(
  aiState: ReturnType<typeof getMutableAIState> | undefined
): Record<string, ToolRenderer> {
  const toolDefinitions = getToolDefinitions()
  return {
    listStocks: {
      generate: async function* ({
        stocks
      }: z.infer<typeof toolDefinitions.listSocks.parameters>) {
        yield (
          <BotCard>
            <StocksSkeleton />
          </BotCard>
        )
        console.log(aiState?.get().model)
        console.log("here inside server.....")
        const response = await fetch(
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
              chat_id: 'test_chat',
              kind: 'calculator',
              payload: { key: 'value' },
              status: 'pending',
            })
          }
        )

        const toolCallId = ((await response.json()) as { id: string }).id

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
                  toolName: 'listStocks',
                  toolCallId,
                  args: { stocks }
                }
              ]
            },
            {
              id: nanoid(),
              role: 'tool',
              content: [
                {
                  type: 'tool-result',
                  toolName: 'listStocks',
                  toolCallId,
                  result: stocks
                }
              ]
            }
          ]
        })

        return (
          <BotCard>
            <Stocks props={stocks} />
          </BotCard>
        )
      }
    },
    showStockPrice: {
      generate: async function* ({
        symbol,
        price,
        delta
      }: z.infer<typeof toolDefinitions.showStockPrice.parameters>) {
        yield (
          <BotCard>
            <StockSkeleton />
          </BotCard>
        )

        await sleep(1000)
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
                  toolName: 'showStockPrice',
                  toolCallId,
                  args: { symbol, price, delta }
                }
              ]
            },
            {
              id: nanoid(),
              role: 'tool',
              content: [
                {
                  type: 'tool-result',
                  toolName: 'showStockPrice',
                  toolCallId,
                  result: { symbol, price, delta }
                }
              ]
            }
          ]
        })

        return (
          <BotCard>
            <Stock props={{ symbol, price, delta }} />
          </BotCard>
        )
      }
    },
    showStockPurchase: {
      generate: async function* ({
        symbol,
        price,
        numberOfShares = 100
      }: z.infer<typeof toolDefinitions.showStockPurchase.parameters>) {
        const toolCallId = nanoid()
        if (numberOfShares <= 0 || numberOfShares > 1000) {
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
                    toolName: 'showStockPurchase',
                    toolCallId,
                    args: { symbol, price, numberOfShares }
                  }
                ]
              },
              {
                id: nanoid(),
                role: 'tool',
                content: [
                  {
                    type: 'tool-result',
                    toolName: 'showStockPurchase',
                    toolCallId,
                    result: {
                      symbol,
                      price,
                      numberOfShares,
                      status: 'expired'
                    }
                  }
                ]
              },
              {
                id: nanoid(),
                role: 'system',
                content: `[User has selected an invalid amount]`
              }
            ]
          })

          return <BotMessage content={'Invalid amount'} />
        }

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
                  toolName: 'showStockPurchase',
                  toolCallId,
                  args: { symbol, price, numberOfShares }
                }
              ]
            },
            {
              id: nanoid(),
              role: 'tool',
              content: [
                {
                  type: 'tool-result',
                  toolName: 'showStockPurchase',
                  toolCallId,
                  result: {
                    symbol,
                    price,
                    numberOfShares
                  }
                }
              ]
            }
          ]
        })

        return (
          <BotCard>
            <Purchase
              props={{
                numberOfShares,
                symbol,
                price: +price,
                status: 'requires_action'
              }}
            />
          </BotCard>
        )
      }
    },
    getEvents: {
      generate: async function* ({
        events
      }: z.infer<typeof toolDefinitions.getEvents.parameters>) {
        yield (
          <BotCard>
            <EventsSkeleton />
          </BotCard>
        )

        await sleep(1000)
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
                  toolName: 'getEvents',
                  toolCallId,
                  args: { events }
                }
              ]
            },
            {
              id: nanoid(),
              role: 'tool',
              content: [
                {
                  type: 'tool-result',
                  toolName: 'getEvents',
                  toolCallId,
                  result: events
                }
              ]
            }
          ]
        })

        return (
          <BotCard>
            <Events props={events} />
          </BotCard>
        )
      }
    },
    search: {
      generate: async function* ({
        query
      }: z.infer<typeof toolDefinitions.search.parameters>) {
        yield (
          <BotCard>
            <EventsSkeleton />
          </BotCard>
        )
        // await sleep(1000)
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
                  toolName: 'search',
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
                  toolName: 'search',
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
