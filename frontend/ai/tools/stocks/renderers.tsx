import { z } from 'zod'

import { EventsSkeleton } from './components/events-skeleton'
import { Events } from './components/events'
import { StocksSkeleton } from './components/stocks-skeleton'
import { Stocks } from './components/stocks'
import { StockSkeleton } from './components/stock-skeleton'
import { getMutableAIState } from 'ai/rsc'

import {
  BotCard,
  BotMessage,
  Stock,
  Purchase
} from '@/ai/tools/stocks/components'

import { sleep, nanoid } from '@/lib/utils'
import { getToolDefinitions } from './definitions'

import { type ToolRenderer } from '@/ai/tools/types'

export function getToolRenderers(
  aiState: ReturnType<typeof getMutableAIState> | undefined
): Record<string, ToolRenderer> {
  const toolDefinitions = getToolDefinitions()
  return {
    listStocks: {
      render: async function* ({
        stocks
      }: z.infer<typeof toolDefinitions.listSocks.parameters>) {
        yield (
          <BotCard>
            <StocksSkeleton />
          </BotCard>
        )

        await sleep(1000)

        aiState?.done({
          ...aiState.get(),
          messages: [
            ...aiState.get().messages,
            {
              id: nanoid(),
              role: 'function',
              name: 'listStocks',
              content: JSON.stringify(stocks)
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
      render: async function* ({
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

        aiState?.done({
          ...aiState.get(),
          messages: [
            ...aiState.get().messages,
            {
              id: nanoid(),
              role: 'function',
              name: 'showStockPrice',
              content: JSON.stringify({ symbol, price, delta })
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
      render: async function* ({
        symbol,
        price,
        numberOfShares = 100
      }: z.infer<typeof toolDefinitions.showStockPurchase.parameters>) {
        if (numberOfShares <= 0 || numberOfShares > 1000) {
          aiState?.done({
            ...aiState.get(),
            messages: [
              ...aiState.get().messages,
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
              role: 'function',
              name: 'showStockPurchase',
              content: JSON.stringify({
                symbol,
                price,
                numberOfShares
              })
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
      render: async function* ({
        events
      }: z.infer<typeof toolDefinitions.getEvents.parameters>) {
        yield (
          <BotCard>
            <EventsSkeleton />
          </BotCard>
        )

        await sleep(1000)

        aiState?.done({
          ...aiState.get(),
          messages: [
            ...aiState.get().messages,
            {
              id: nanoid(),
              role: 'function',
              name: 'getEvents',
              content: JSON.stringify(events)
            }
          ]
        })

        return (
          <BotCard>
            <Events props={events} />
          </BotCard>
        )
      }
    }
  }
}
