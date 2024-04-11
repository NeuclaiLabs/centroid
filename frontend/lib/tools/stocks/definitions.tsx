import { z } from 'zod'

import { EventsSkeleton } from '@/lib/tools/stocks/components/events-skeleton'
import { Events } from '@/lib/tools/stocks/components/events'
import { StocksSkeleton } from '@/lib/tools/stocks/components/stocks-skeleton'
import { Stocks } from '@/lib/tools/stocks/components/stocks'
import { StockSkeleton } from '@/lib/tools/stocks/components/stock-skeleton'
import { getMutableAIState } from 'ai/rsc'

import {
  BotCard,
  BotMessage,
  Stock,
  Purchase
} from '@/lib/tools/stocks/components'

import { sleep, nanoid } from '@/lib/utils'

export function getTools(
  aiState: ReturnType<typeof getMutableAIState> | undefined
) {
  return {
    listStocks: {
      description: 'List three imaginary stocks that are trending.',
      component: 'stocks',
      parameters: z.object({
        stocks: z.array(
          z.object({
            symbol: z.string().describe('The symbol of the stock'),
            price: z.number().describe('The price of the stock'),
            delta: z.number().describe('The change in price of the stock')
          })
        )
      }),
      render: async function* ({ stocks }: z.infer<typeof this.parameters>) {
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
      description:
        'Get the current stock price of a given stock or currency. Use this to show the price to the user.',
      component: 'stock',
      parameters: z.object({
        symbol: z
          .string()
          .describe(
            'The name or symbol of the stock or currency. e.g. DOGE/AAPL/USD.'
          ),
        price: z.number().describe('The price of the stock.'),
        delta: z.number().describe('The change in price of the stock')
      }),
      render: async function* ({
        symbol,
        price,
        delta
      }: z.infer<typeof this.parameters>) {
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
      description:
        'Show price and the UI to purchase a stock or currency. Use this if the user wants to purchase a stock or currency.',
      component: 'purchase',
      parameters: z.object({
        symbol: z
          .string()
          .describe(
            'The name or symbol of the stock or currency. e.g. DOGE/AAPL/USD.'
          ),
        price: z.number().describe('The price of the stock.'),
        numberOfShares: z
          .number()
          .describe(
            'The **number of shares** for a stock or currency to purchase. Can be optional if the user did not specify it.'
          )
      }),
      render: async function* ({
        symbol,
        price,
        numberOfShares = 100
      }: z.infer<typeof this.parameters>) {
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
      description:
        'List funny imaginary events between user highlighted dates that describe stock activity.',
      component: 'events',
      parameters: z.object({
        events: z.array(
          z.object({
            date: z
              .string()
              .describe('The date of the event, in ISO-8601 format'),
            headline: z.string().describe('The headline of the event'),
            description: z.string().describe('The description of the event')
          })
        )
      }),
      render: async function* ({ events }: z.infer<typeof this.parameters>) {
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

export const components: Record<string, any> = {
  stock: Stock,
  purchase: Purchase,
  events: Events,
  stocks: Stocks
}
