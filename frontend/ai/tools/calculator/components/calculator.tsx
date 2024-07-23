'use client'

import { useContext } from 'react'
import { useActions, useUIState } from 'ai/rsc'

import type { AI } from '@/lib/chat/actions'
import { ModelSelectionContext } from '@/lib/hooks/use-model-selection'

interface Result {
  result: string
}

export function Calculator({ props: result }: { props: Result }) {
  const [, setMessages] = useUIState<typeof AI>()
  const { submitUserMessage } = useActions()
  const { selectedModel } = useContext(ModelSelectionContext)

  return (
    <div>
      {result.result}
      <div className="p-4 text-center text-sm text-zinc-500">
        Note: Data and latency are simulated for illustrative purposes and
        should not be considered as financial advice.
      </div>
    </div>
  )
}
