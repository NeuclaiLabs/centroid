'use client'

import { Attachment, Message } from "ai"
import { useChat } from "ai/react"
import { useState } from "react"

import { MultimodalInput } from "./multimodal-input"
import { Message as PreviewMessage } from "@/components/custom/message"
import { useScrollToBottom } from "@/components/custom/use-scroll-to-bottom"


export function Chat({ id, initialMessages }: { id: string; initialMessages: Array<Message> }) {
  const { messages, handleSubmit, input, setInput, append, isLoading, stop } = useChat({
    body: { id },
    initialMessages,
    onFinish: () => {
      window.history.replaceState({}, "", `/chat/${id}`)
    },
  })

  const [messagesContainerRef, messagesEndRef] = useScrollToBottom<HTMLDivElement>()

  const [attachments, setAttachments] = useState<Array<Attachment>>([])

  return (
    <div className="flex flex-col justify-between items-center gap-4 size-full overflow-hidden">
      <div
        ref={messagesContainerRef}
        className="flex flex-col gap-4 w-full max-w-3xl mx-auto px-4 overflow-y-auto grow"
      >
        {messages.length > 0 &&
          messages.map((message, index) => (
            <PreviewMessage
              key={`${id}-${index}`}
              role={message.role}
              content={message.content}
              attachments={message.experimental_attachments}
              toolInvocations={message.toolInvocations}
            />
          ))
        }
        <div ref={messagesEndRef} className="shrink-0 min-w-[24px] min-h-[24px]" />
      </div>

      <div className="w-full max-w-3xl mx-auto px-4 pb-4 md:pb-8">
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
    </div>
  )
}
