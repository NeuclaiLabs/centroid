import { z } from 'zod'

import { type ToolDefinition } from '@/ai/tools/types'

export function getToolDefinitions(): Record<string, ToolDefinition> {
  return {
    listStocks: {
      description: 'List three imaginary stocks that are trending.',
      parameters: z.object({
        stocks: z.array(
          z.object({
            symbol: z.string().describe('The symbol of the stock'),
            price: z.number().describe('The price of the stock'),
            delta: z.number().describe('The change in price of the stock')
          })
        )
      })
    },
    showStockPrice: {
      description:
        'Get the current stock price of a given stock or currency. Use this to show the price to the user.',
      parameters: z.object({
        symbol: z
          .string()
          .describe(
            'The name or symbol of the stock or currency. e.g. DOGE/AAPL/USD.'
          ),
        price: z.number().describe('The price of the stock.'),
        delta: z.number().describe('The change in price of the stock')
      })
    },
    showStockPurchase: {
      description:
        'Show price and the UI to purchase a stock or currency. Use this if the user wants to purchase a stock or currency.',
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
      })
    },
    getEvents: {
      description:
        'List funny imaginary events between user highlighted dates that describe stock activity.',
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
      })
    }
  }
}
