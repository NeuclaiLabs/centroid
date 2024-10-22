'use client'

import { Attachment, Message } from "ai"
import { useChat } from "ai/react"
import { useState, useEffect, useRef } from "react"
import { useMediaQuery } from "react-responsive"

import { Message as PreviewMessage } from "@/components/custom/message"
import { MultimodalInput } from "@/components/custom/multimodal-input"
import { useSidebar, SIDEBAR_WIDTH } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

// Custom hook for scrolling to bottom
const useScrollToBottom = () => {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "auto" })
  }

  return [messagesEndRef, scrollToBottom] as const
}

export function Chat({ id, initialMessages }: { id: string; initialMessages: Array<Message> }) {
  const { messages, handleSubmit, input, setInput, append, isLoading, stop } = useChat({
    body: { id },
    initialMessages,
    onFinish: () => {
      window.history.replaceState({}, "", `/chat/${id}`)
    },
  })

  const [messagesEndRef, scrollToBottom] = useScrollToBottom()

  const [attachments, setAttachments] = useState<Array<Attachment>>([])
  // @ts-ignore
  const { isOpen } = useSidebar()
  const isLargeScreen = useMediaQuery({ minWidth: 1024 })

  const [contentStyle, setContentStyle] = useState({})
  const suggestions = [
    "Generate a multi-step onboarding flow",
    "How can I schedule cron jobs?",
    "Write code to implement a min heap"
  ]


  useEffect(() => {
    const sidebarWidth = isLargeScreen && isOpen ? SIDEBAR_WIDTH : 0
    const newStyle = {
      marginLeft: sidebarWidth,
      width: `calc(100% - ${sidebarWidth})`,
    }
    setContentStyle(newStyle)
  }, [isOpen, isLargeScreen])

  // Ensure scrolling to the bottom when new messages are appended
  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  return (
    messages.length === 0 ? (
      <div className="flex-1 flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-3xl mx-auto p-8 space-y-8 bg-background border-none shadow-none">
        <h1 className="text-4xl md:text-5xl font-bold text-center">
          What can I help you with?
        </h1>
        <form className="flex flex-col items-center w-full space-y-4" onSubmit={handleSubmit}>
          <div className="w-full">
            <MultimodalInput
              input={input}
              setInput={setInput}
              handleSubmit={handleSubmit}
              isLoading={isLoading}
              stop={stop}
              attachments={attachments}
              setAttachments={setAttachments}
              messages={messages}
              append={append}
            />
          </div>

          <div className="flex flex-wrap justify-center gap-2 pb-40">
            {suggestions.map((suggestion, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                className="text-xs px-2 py-1 h-auto"
                onClick={() => setInput(suggestion)}
              >
                {suggestion}
              </Button>
            ))}
          </div>
        </form>
      </Card>
    </div>
    ):
    <div className="flex flex-col h-full overflow-hidden" style={contentStyle}>
      {/* Wrapper for centering both messages and footer */}
      <div className="flex flex-col items-center justify-center size-full">
        <div className="flex-1 overflow-y-auto w-full max-w-3xl px-4 pb-32">
          {messages.length > 0 &&
            messages.map((message, index) => (
              <div key={`${message.id || `${id}-${index}`}`} className="mb-2">
                <PreviewMessage
                  role={message.role}
                  content={message.content}
                  attachments={message.experimental_attachments}
                  toolInvocations={message.toolInvocations}
                />
              </div>
            ))}
          <div ref={messagesEndRef} />
        </div>
        {/* Footer remains within this flex-centered wrapper */}
        <footer className="bg-background w-full max-w-3xl fixed bottom-0">
          <div className="w-full p-4 md:py-6" style={{ paddingTop: 0 }}>
            <form className="flex flex-row gap-2 relative items-end w-full">
              <MultimodalInput
                input={input}
                setInput={setInput}
                handleSubmit={handleSubmit}
                isLoading={isLoading}
                stop={stop}
                attachments={attachments}
                setAttachments={setAttachments}
                messages={messages}
                append={append}
              />
            </form>
          </div>
        </footer>
      </div>
    </div>
  )
}
