'use client'

import dynamic from 'next/dynamic'
import { type ToolUIComponent } from '@/ai/tools/types'

export { spinner } from '@/components/spinner'
export { BotCard, BotMessage, SystemMessage } from '@/components/message'

const Calculator = dynamic(
  () => import('./calculator').then(mod => mod.Calculator),
  {
    ssr: false,
    loading: () => <div>Calculating...</div>
  }
)

export { Calculator }
