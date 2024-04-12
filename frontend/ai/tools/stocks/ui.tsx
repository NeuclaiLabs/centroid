import { Events, Stocks, Stock, Purchase } from '@/ai/tools/stocks/components'
import { type ToolUIComponent } from '@/ai/tools/types'

export function getToolUIComponents(): Record<string, ToolUIComponent> {
  return {
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
}
