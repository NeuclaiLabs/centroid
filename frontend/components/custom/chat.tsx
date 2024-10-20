'use client'

import { Attachment, Message } from "ai"
import { useChat } from "ai/react"
import { useState, useEffect } from "react"
import { useMediaQuery } from "react-responsive"

import { MultimodalInput } from "@/components/custom/multimodal-input"
import { Message as PreviewMessage } from "@/components/custom/message"
import { useScrollToBottom } from "@/components/custom/use-scroll-to-bottom"
import { useSidebar } from "@/components/ui/sidebar"

import { SIDEBAR_WIDTH, SIDEBAR_WIDTH_MOBILE, SIDEBAR_WIDTH_ICON } from "@/components/ui/sidebar"

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
  const { isOpen } = useSidebar()
  const isLargeScreen = useMediaQuery({ minWidth: 1024 })

  const [footerStyle, setFooterStyle] = useState({})

  useEffect(() => {
    const sidebarWidth = isLargeScreen && isOpen ? SIDEBAR_WIDTH : SIDEBAR_WIDTH_ICON
    const newStyle = {
      marginLeft: sidebarWidth,
      width: `calc(100% - ${sidebarWidth})`,
    }
    setFooterStyle(newStyle)
  }, [isOpen, isLargeScreen])

  return (
    <div className="flex flex-col justify-between items-center gap-4 size-full overflow-hidden">
      <div
        ref={messagesContainerRef}
        className="flex flex-col gap-4 w-full max-w-3xl mx-auto px-4 overflow-y-auto grow pb-32"
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

      <footer
        className="fixed bottom-0 bg-background  transition-all duration-300 ease-in-out"
        style={footerStyle}
      >
        <div className="w-full max-w-3xl mx-auto p-4 md:py-6 border-0" style={{ paddingTop: 0 }}>
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
  )
}
