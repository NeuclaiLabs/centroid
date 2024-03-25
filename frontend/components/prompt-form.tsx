import * as React from "react"
import { useRouter } from "next/navigation"
import { UseChatHelpers } from "ai/react"
import Textarea from "react-textarea-autosize"

import { useEnterSubmit } from "@/lib/hooks/use-enter-submit"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { IconArrowElbow, IconPlus } from "@/components/icons"

export interface PromptProps
  extends Pick<UseChatHelpers, "input" | "setInput"> {
  onSubmit: (value: string) => void
  isLoading: boolean
}

export function PromptForm({
  onSubmit,
  input,
  setInput,
  isLoading,
}: PromptProps) {
  const { formRef, onKeyDown } = useEnterSubmit()
  const inputRef = React.useRef<HTMLTextAreaElement>(null)
  const router = useRouter()
  React.useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])
  const [value, setValue] = React.useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(value)
    setValue("")
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="flex w-full  items-stretch">
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="flex items-center justify-center rounded-l-md px-2  focus:outline-none dark:bg-secondary"
          >
            <span className="sr-only">Add Follow-up</span>
            <IconPlus />
          </button>
        </TooltipTrigger>
        <TooltipContent>Ask follow up questions</TooltipContent>
      </Tooltip>
      <Textarea
        value={value}
        onKeyDown={onKeyDown}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Ask follow-up"
        className="grow resize-none rounded-none border-x-0 border-none border-gray-300  py-2 focus-within:outline-none focus:outline-none focus:ring-0"
        autoFocus
      />
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="submit"
            className="flex items-center justify-center rounded-l-md px-2  focus:outline-none dark:bg-secondary"
          >
            <span className="sr-only">Add Follow-up</span>
            <IconArrowElbow />
          </button>
        </TooltipTrigger>
        <TooltipContent>Send message</TooltipContent>
      </Tooltip>
    </form>
  )
}
