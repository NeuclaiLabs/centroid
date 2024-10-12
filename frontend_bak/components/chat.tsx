'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { ChatList } from '@/components/chat-list'
import { ChatPanel } from '@/components/chat-panel'
import { EmptyScreen } from '@/components/empty-screen'
import { useUIState, useAIState } from 'ai/rsc'
import { Session, Message } from '@/lib/types'
import { useLocalStorage } from '@/lib/hooks/use-local-storage'
import { usePathname, useRouter } from 'next/navigation'
import { useScrollAnchor } from '@/lib/hooks/use-scroll-anchor'

export interface ChatProps extends React.ComponentProps<'div'> {
  initialMessages?: Message[]
  id?: string
  session?: Session
  missingKeys: string[]
}

export function Chat({ id, className, session, missingKeys }: ChatProps) {
  const router = useRouter()
  const path = usePathname()
  const [input, setInput] = useState('')
  const [messages] = useUIState()
  const [aiState] = useAIState()
  const [_, setNewChatId] = useLocalStorage('newChatId', id)
  const [previewContent, setPreviewContent] = useState<string | null>(null)

  useEffect(() => {
    if (session?.user && !path.includes('chat') && messages.length === 1) {
      window.history.replaceState({}, '', `/chat/${id}`)
    }
  }, [id, path, session?.user, messages])

  useEffect(() => {
    setNewChatId(id)
  })

  useEffect(() => {
    missingKeys.forEach(key => {
      toast.error(`Missing ${key} environment variable!`)
    })
  }, [missingKeys])

  const { messagesRef, scrollRef, visibilityRef, isAtBottom, scrollToBottom } =
    useScrollAnchor()

  const handlePreview = (content: string) => {
    setPreviewContent(content)
  }

  return (
    <div className="flex size-full">
      {/* Chat Section */}
      <div className="flex-1 flex flex-col relative">
        {/* Scrollable chat messages */}
        <div
          className="flex-1 overflow-auto pb-[160px] pt-4 md:pt-10"
          ref={messagesRef}
        >
          {messages.length ? (
            <ChatList
              messages={messages}
              isShared={false}
              session={session}
              onPreview={handlePreview}
            />
          ) : (
            <EmptyScreen />
          )}
          <div className="h-px w-full" ref={visibilityRef} />
        </div>
        {/* Fixed ChatPanel only within this chat section */}
        <div className="absolute bottom-0 inset-x-0 bg-white border-t border-gray-200">
          <ChatPanel
            id={id}
            input={input}
            setInput={setInput}
            isAtBottom={isAtBottom}
            scrollToBottom={scrollToBottom}
          />
        </div>
      </div>

      {/* Preview Section */}
      <div className="w-1/2 border-l border-gray-200 p-4">
        <h2 className="text-lg font-semibold mb-4">Preview</h2>
        {previewContent ? (
          <div className="bg-gray-100 p-4 rounded">
            <pre className="whitespace-pre-wrap">{previewContent}</pre>
          </div>
        ) : (
          <p>No preview available</p>
        )}
      </div>
    </div>
  )
}
