import { Message } from "ai/react"

import { Skeleton } from "@/components/ui/skeleton"
import { ButtonScrollToBottom } from "@/components/button-scroll-to-bottom"
import { ButtonGroup } from "@/components/conversation-actions"
import { Suggestions } from "@/components/suggestions"

export function Answer({
  message,
  isLoading,
}: {
  message: Message
  isLoading: boolean
}) {
  return (
    <>
      <div className="col-span-1 p-4 lg:col-span-2" key={message.id}>
        <div className="rounded-md">
          <ButtonScrollToBottom />
          <h2 className="pb-2 font-bold uppercase">Answer</h2>
          <p className="overflow-wrap text-base">{message.content}</p>
          <ButtonGroup /> <Suggestions />
        </div>
      </div>
    </>
  )
}
