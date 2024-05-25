import 'server-only'

import {
  createAI,
  getMutableAIState,
  getAIState,
  streamUI,
  createStreamableValue
} from 'ai/rsc'
import { getTools } from '@/ai/tools'

import { confirmPurchase } from '@/ai/tools/stocks/actions'

import { createOpenAI, openai } from '@ai-sdk/openai'
import { createOllama } from 'ollama-ai-provider'

import { BotCard, BotMessage } from '@/ai/tools/stocks/components'

import { nanoid } from '@/lib/utils'
import { saveChat } from '@/app/actions'
import { SpinnerMessage, UserMessage } from '@/components/message'
import { Chat, Model, Message } from '@/lib/types'
import { auth } from '@/auth'

async function submitUserMessage(content: string, model: Model) {
  'use server'
  let provider = null
  switch (model.connection.type) {
    case 'groq':
    case 'openai':
      provider = createOpenAI({
        baseURL: model.connection.data.url || 'https://api.openai.com/v1',
        apiKey: model.connection.data.key || process.env.OPENAI_API_KEY
      })
      break
    default:
      provider = createOllama({
        baseURL: 'http://localhost:11434/api'
      })
  }

  const aiState = getMutableAIState<typeof AI>()

  aiState.update({
    ...aiState.get(),
    messages: [
      ...aiState.get().messages,
      {
        id: nanoid(),
        role: 'user',
        content
      }
    ]
  })

  let textStream: undefined | ReturnType<typeof createStreamableValue<string>>
  let textNode: undefined | React.ReactNode
  const result = await streamUI({
    model: provider(model!.name || model.id),
    initial: <SpinnerMessage />,
    messages: [
      {
        role: 'system',
        content: `\
You are a helpful assistant which has access to the tools.
Web Search: This tool augments your capabilities by performing web search to respond to user queries. Use this tool whenever it helps with giving more relevant and up-to-date information to the user.

Besides that, you can also chat with users and do some calculations if needed.
If you believe the tools would be helpful:
- Think through which tool or tools would be most relevant and in what order you should use them.
- Only use the tools included in the <tools> list, and use them exactly as specified (don't modify the tool names or arguments).

If you don't believe the tools are needed to answer the query:
- Simply provide the response directly, without using any tools.

In all cases, do your best to provide a helpful answer to the user's query, whether that involves using tools or not. If you're not sure about something, it's okay to say so in your answer. Always prioritize giving an honest, helpful response over using the tools unnecessarily.
`
      },
      ...aiState.get().messages.map((message: any) => ({
        role: message.role || 'user',
        content: message.content,
        name: message.name
      }))
    ],
    text: ({ content, done, delta }) => {
      if (!textStream) {
        textStream = createStreamableValue('')
        textNode = <BotMessage content={textStream.value} />
      }

      if (done) {
        textStream.done()
        aiState.done({
          ...aiState.get(),
          messages: [
            ...aiState.get().messages,
            {
              id: nanoid(),
              role: 'assistant',
              content
            }
          ]
        })
      } else {
        textStream.update(delta)
      }

      return textNode
    },
    tools: getTools(aiState)
  })

  return {
    id: nanoid(),
    display: result.value
  }
}

export type AIState = {
  chatId: string
  messages: Message[]
}

export type UIState = {
  id: string
  display: React.ReactNode
}[]

export const AI = createAI<AIState, UIState>({
  actions: {
    submitUserMessage,
    confirmPurchase
  },
  initialUIState: [],
  initialAIState: { chatId: nanoid(), messages: [] },
  onGetUIState: async () => {
    'use server'
    const session = await auth()

    if (session && session.user) {
      const aiState = getAIState()

      if (aiState) {
        const uiState = getUIStateFromAIState(aiState)
        return uiState
      }
    } else {
      return
    }
  },
  onSetAIState: async ({ state }) => {
    'use server'

    const session = await auth()

    if (session && session.user) {
      const { chatId, messages } = state

      const createdAt = new Date()
      const userId = session.user.id as string
      const path = `/chat/${chatId}`
      const firstMessageContent = messages[0].content as string
      const title = firstMessageContent.substring(0, 100)
      const chat: Chat = {
        id: chatId,
        title,
        userId,
        createdAt,
        messages,
        path
      }

      await saveChat(chat)
    } else {
      return
    }
  }
})

export const getUIStateFromAIState = (aiState: Chat) => {
  return aiState.messages
    .filter(message => message.role !== 'system')
    .map((message, index) => ({
      id: `${aiState.chatId}-${index}`,
      display:
        message.role === 'tool' ? (
          message.content.map(tool => {
            try {
              const DynamicComponent =
                getTools(undefined)[
                  tool.toolName as keyof ReturnType<typeof getTools>
                ].component
              return (
                <BotCard>
                  <DynamicComponent props={tool.result} />
                </BotCard>
              )
            } catch (error: any) {
              console.error(
                `Error fetching component for message ${tool.toolName}: ${error.message}`
              )
              return null
            }
          })
        ) : message.role === 'user' ? (
          <UserMessage>{message.content as string}</UserMessage>
        ) : message.role === 'assistant' &&
          typeof message.content === 'string' ? (
          <BotMessage content={message.content} />
        ) : null
    })) as UIState
}
