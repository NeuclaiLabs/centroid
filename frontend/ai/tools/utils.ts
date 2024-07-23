import { getMutableAIState } from 'ai/rsc/dist'
import { nanoid } from 'nanoid'

export const addToolMessages = (
  messages: any[],
  aiState: ReturnType<typeof getMutableAIState> | undefined
) => {
  aiState?.done({
    ...aiState.get(),
    messages: [...aiState.get().messages, ...messages]
  })
}
