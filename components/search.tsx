"use client"

import React, { ChangeEvent, useState } from "react"
import { useRouter } from "next/navigation"

import { useAvailableModels } from "@/lib/hooks/use-available-models"
import { useSelectedModel } from "@/lib/hooks/use-selected-model"
import { AutosizeTextarea } from "@/components/ui/autosize-textarea"
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
  const [addSearchToContext, setaddSearchToContext] = useState<boolean>(false)
  const availableModels = useAvailableModels()
  const [selectedModel, updateSelectedModel] = useSelectedModel()

  const onButtonClick = () => {
    router.push("/search?q=" + searchQuery.trim())
  }

  const handleSearchChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setSearchQuery(e.target.value)
  }

  const handleaddSearchToContextToggle = () => {
    setaddSearchToContext(!addSearchToContext)
  }

  return (
    <div className="flex size-full flex-col items-center justify-center space-y-4">
      <h4 className="text-center text-3xl font-extrabold leading-tight tracking-tighter md:text-4xl">
        Get answers to your coding questions
      </h4>
      <div className="flex w-full flex-col items-center justify-center">
        <div className="group flex w-full max-w-[800px] flex-col space-y-2 rounded-lg border-2 border-gray-200 px-3 py-2">
          <AutosizeTextarea
            className="h-12 w-full border-0 px-2 py-1 focus-visible:outline-none focus-visible:ring-0"
            placeholder="What do you want to ask?"
            value={searchQuery}
            onChange={handleSearchChange}
            maxHeight={200}
          />
          <div className="flex w-full items-center justify-between">
            <div className="flex flex-wrap items-center">
              <div
                className="flex items-center"
                aria-haspopup="menu"
                aria-expanded="false"
              >
                <Select
                  defaultValue={selectedModel ? selectedModel.id : "undefined"}
                  onValueChange={updateSelectedModel}
                >
                  <SelectTrigger className="line-clamp-1 w-[280px] truncate border-none bg-transparent text-xs shadow-none outline-none focus:ring-0 focus-visible:ring-0">
                    <SelectValue placeholder="Select Model" />
                  </SelectTrigger>

                  <SelectContent>
                    {availableModels &&
                      availableModels.map((model) => (
                        <SelectItem key={model.id} value={model.name}>
                          {model.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-8 flex w-full max-w-[800px] flex-col items-center gap-4">
          <div className="flex w-full flex-col gap-2  md:flex-row md:flex-wrap md:justify-center">
            <Button
              className="h-8 text-xs"
              variant="secondary"
              onClick={onButtonClick}
            >
              What new in NextJS 14?
            </Button>
            <Button
              className="text-xs"
              size="sm"
              variant="secondary"
              onClick={onButtonClick}
            >
              How to get useragent new in NextJS 14??
            </Button>
            <Button
              className="text-xs"
              size="sm"
              variant="secondary"
              onClick={onButtonClick}
            >
              How to get useragent new in NextJS 14?
            </Button>
            <Button
              className="text-xs"
              size="sm"
              variant="secondary"
              onClick={onButtonClick}
            >
              What new in NextJS 14?
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
