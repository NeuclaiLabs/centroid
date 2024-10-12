'use client'

import * as React from 'react'
import Textarea from 'react-textarea-autosize'
import { useEffect, useState, useContext, useRef } from 'react'
import { useActions, useUIState } from 'ai/rsc'
import { UserMessage } from '@/components/message'
import { type AI } from '@/lib/chat/actions'
import { Button } from '@/components/ui/button'
import {
  IconArrowUp,
  IconPlus,
  IconPaperClip,
  IconClose
} from '@/components/ui/icons'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip'
import { useEnterSubmit } from '@/lib/hooks/use-enter-submit'
import { nanoid } from 'nanoid'
import { useRouter } from 'next/navigation'
import { ModelSelectionContext } from '@/lib/hooks/use-model-selection'
import { useTelemetry } from '@/lib/hooks/use-telemetry'
import { Input } from '@/components/ui/input'

const MAX_ATTACHMENTS = 5;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB in bytes

export function PromptForm({
  input,
  setInput
}: {
  input: string
  setInput: (value: string) => void
}) {
  const router = useRouter()
  const { formRef, onKeyDown } = useEnterSubmit()
  const inputRef = React.useRef<HTMLTextAreaElement>(null)
  const { submitUserMessage } = useActions()
  const { selectedModel } = useContext(ModelSelectionContext)
  const { trackEvent } = useTelemetry()
  const [_, setMessages] = useUIState<typeof AI>()
  const [attachments, setAttachments] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files) {
      const newAttachments = Array.from(files).filter(file => {
        if (file.size > MAX_FILE_SIZE) {
          alert(`File ${file.name} exceeds the maximum size limit of 5 MB.`)
          return false
        }
        return true
      })

      setAttachments(prevAttachments => {
        const updatedAttachments = [...prevAttachments, ...newAttachments]
        if (updatedAttachments.length > MAX_ATTACHMENTS) {
          alert(`You can only attach up to ${MAX_ATTACHMENTS} files.`)
          return updatedAttachments.slice(0, MAX_ATTACHMENTS)
        }
        return updatedAttachments
      })
    }
  }

  const removeAttachment = (index: number) => {
    setAttachments(prevAttachments =>
      prevAttachments.filter((_, i) => i !== index)
    )
  }

  const handleSubmit = async (e: any) => {
    e.preventDefault()
    const value = input.trim()
    setInput('')
    if (!value && attachments.length === 0) return

    // Optimistically add user message UI
    setMessages(currentMessages => [
      ...currentMessages,
      {
        id: nanoid(),
        display: <UserMessage>{value}</UserMessage>
      }
    ])

    trackEvent({
      eventType: 'Submit Message'
      // Additional properties can be added here
    })

    // TODO: Handle file uploads
    // This is where you'd implement the logic to upload files and include them in the message

    // Submit and get response message
    const responseMessage = await submitUserMessage(value, selectedModel)
    setMessages(currentMessages => [...currentMessages, responseMessage])

    // Clear attachments after sending
    setAttachments([])
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit}>
      <div className="relative flex max-h-60 w-full grow flex-col overflow-hidden bg-background px-8 sm:rounded-md sm:border sm:px-12">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="absolute left-0 top-[14px] size-8 rounded-full bg-background p-0 sm:left-4"
              onClick={() => fileInputRef.current?.click()}
            >
              <IconPaperClip />
              <span className="sr-only">Attach File</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Attach File</TooltipContent>
        </Tooltip>
        <Input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          multiple
        />
        {attachments.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {attachments.map((file, index) => (
              <div
                key={index}
                className="flex items-center rounded-md bg-background p-2"
              >
                <span className="text-sm">{file.name}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="ml-2 size-5"
                  onClick={() => removeAttachment(index)}
                >
                  <IconClose className="size-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
        <Textarea
          ref={inputRef}
          tabIndex={0}
          onKeyDown={onKeyDown}
          placeholder="Send a message."
          className="min-h-[60px] w-full resize-none bg-transparent px-4 py-[1.3rem] focus-within:outline-none sm:text-sm"
          autoFocus
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          name="message"
          rows={1}
          value={input}
          onChange={e => setInput(e.target.value)}
        />
        <div className="absolute right-0 top-[13px] sm:right-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="submit"
                size="icon"
                disabled={input === '' && attachments.length === 0}
              >
                <IconArrowUp />
                <span className="sr-only">Send message</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Send message</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </form>
  )
}
