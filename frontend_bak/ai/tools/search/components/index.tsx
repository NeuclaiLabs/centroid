'use client'

import dynamic from 'next/dynamic'
import { type ToolUIComponent } from '@/ai/tools/types'

export { spinner } from '@/components/spinner'
export { BotCard, BotMessage, SystemMessage } from '@/components/message'

const Search = dynamic(() => import('./search').then(mod => mod.Search), {
  ssr: false,
  loading: () => <div>Searching</div>
})

export { Search }
