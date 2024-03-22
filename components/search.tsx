"use client"

import React, { ChangeEvent, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Textarea from "react-textarea-autosize"

import { useAvailableModels } from "@/lib/hooks/use-available-models"
import { useEnterSubmit } from "@/lib/hooks/use-enter-submit"
import { useSelectedModel } from "@/lib/hooks/use-selected-model"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function Search() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState<string>("")
  const availableModels = useAvailableModels()
  const [selectedModel, updateSelectedModel] = useSelectedModel()
  const { formRef, onKeyDown } = useEnterSubmit()
  const inputRef = React.useRef<HTMLTextAreaElement>(null)
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  const onButtonClick = () => {
    const query = searchQuery.trim()
    const encodedQuery = encodeURIComponent(query)
    console.log(query, encodedQuery)
    router.push(`/search?q=${encodedQuery}`)
  }

  const onSuggestionClick = (query: string) => {
    setSearchQuery(query)
    const encodedQuery = encodeURIComponent(query.trim())
    console.log(query, encodedQuery)
    router.push(`/search?q=${encodedQuery}`)
  }

  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setSearchQuery(event.target.value)
  }

  return (
    <div className="flex size-full flex-col items-center justify-center space-y-4">
      <h4 className="text-center text-3xl font-extrabold leading-tight tracking-tighter md:text-4xl">
        Get answers to your coding questions
      </h4>
      <div className="flex w-full flex-col items-center justify-center pb-20">
        <div className="group flex w-full max-w-[800px] flex-col space-y-2 rounded-lg border-2 px-2 py-3  dark:border-none dark:bg-secondary">
          <form
            ref={formRef}
            onSubmit={(e) => {
              e.preventDefault()
              onButtonClick()
            }}
          >
            <Textarea
              className="h-12 w-full resize-none border-0 border-none bg-popover  px-2 py-1 focus-visible:outline-none focus-visible:ring-0 dark:bg-secondary"
              placeholder="What do you want to ask?"
              ref={inputRef}
              tabIndex={0}
              onKeyDown={onKeyDown}
              minRows={2}
              value={searchQuery}
              onChange={handleInputChange}
            />
            <div className="flex w-full items-center justify-between">
              <div className="flex flex-wrap items-center">
                <div
                  className="flex items-center"
                  aria-haspopup="menu"
                  aria-expanded="false"
                >
                  <Select
                    defaultValue={
                      selectedModel ? selectedModel.id : "undefined"
                    }
                    onValueChange={updateSelectedModel}
                  >
                    <SelectTrigger className="line-clamp-1 w-[280px] truncate border-none bg-transparent text-xs shadow-none outline-none focus:ring-0 focus-visible:ring-0">
                      <SelectValue placeholder="Select Model" />
                    </SelectTrigger>

                    <SelectContent>
                      {availableModels &&
                        availableModels.map((model) => (
                          <SelectItem key={model.id} value={model.id}>
                            {model.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </form>
        </div>
        <div className="mt-8 flex w-full max-w-[800px] flex-col items-center gap-4">
          <div className="flex w-full flex-col gap-2  md:flex-row md:flex-wrap md:justify-center">
            <Button
              className="h-8 text-xs"
              variant="secondary"
              onClick={() => {
                onSuggestionClick("How does RLHF work?")
              }}
            >
              How does RLHF work?
            </Button>
            <Button
              className="text-xs"
              size="sm"
              variant="secondary"
              onClick={() => {
                onSuggestionClick("Quicksort explained with code examples?")
              }}
            >
              Quicksort explained with code examples?
            </Button>
            <Button
              className="text-xs"
              size="sm"
              variant="secondary"
              onClick={() => {
                onSuggestionClick("How to get useragent new in NextJS 14?")
              }}
            >
              How to get useragent new in NextJS 14?
            </Button>
            <Button
              className="text-xs"
              size="sm"
              variant="secondary"
              onClick={() => {
                onSuggestionClick("How to deploy React using Docker?")
              }}
            >
              How to deploy React using Docker?
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
