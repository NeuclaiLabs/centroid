import React, { useEffect, useRef } from "react"
import { useChat } from "ai/react"
import Textarea from "react-textarea-autosize"

import { Button } from "@/components/ui/button"
import { ButtonScrollToBottom } from "@/components/button-scroll-to-bottom"
import { ButtonGroup } from "@/components/conversation-actions"
import { PromptForm } from "@/components/prompt-form"
import { Suggestions } from "@/components/suggestions"

export function Conversation({ searchQuery }: { searchQuery: string }) {
  const sources = [
    {
      url: "https://tailwindcss.com/docs/grid-template-columns",

      title: "Grid Template Columns",

      description:
        "By default, Tailwind includes grid-template-column utilities for creating basic grids with up to 12 equal width columns. You can customize these values by.Tailwind CSS grid generator is a tool that helps developers create custom Tailwind grid layouts more easily. The generator allows users to specify the number..",
    },

    {
      url: "https://tailwindcss.com/docs/grid-template-columns",

      title: "Grid Template Columns",

      description:
        "By default, Tailwind includes grid-template-column utilities for creating basic grids with up to 12 equal width columns. You can customize these values by.Tailwind CSS grid generator is a tool that helps developers create custom Tailwind grid layouts more easily. The generator allows users to specify the number..",
    },
  ]
  const {
    messages,
    reload,
    append,
    input,
    isLoading,
    setInput,
    handleInputChange,
    handleSubmit,
  } = useChat({
    onFinish(message) {
      console.log("calling reload", message)
    },
  })

  const effectRanOnce = useRef(false)

  useEffect(() => {
    if (!effectRanOnce.current) {
      effectRanOnce.current = true
      append({ role: "user", content: searchQuery })
    }
  }, [])

  return (
    <div>
      {messages.map((message, index) => (
        <div className="grid gap-4 lg:grid-cols-3" key={index}>
          {index % 2 == 0 ? (
            <>
              <div className="col-span-1 p-4 lg:col-span-2">
                <div className="rounded-md ">
                  <h2 className="mb-2 text-xl font-bold">{message.content}</h2>
                </div>
              </div>
              <div className="col-span-1">
                <div className="rounded-md "></div>
              </div>
            </>
          ) : (
            <>
              <div className="col-span-1 p-4 lg:col-span-2" key={index}>
                <div className="rounded-md ">
                  <ButtonScrollToBottom />
                  <h2 className="pb-2 font-bold uppercase"> Answer</h2>
                  <p className="overflow-wrap  text-base">{message.content}</p>
                  <ButtonGroup /> <Suggestions />
                </div>
              </div>
              <div className="col-span-1 flex p-4">
                <div className="rounded-md ">
                  <h2 className="mb-2 text-lg font-bold">SOURCES</h2>
                  {sources.map((source, index) => (
                    <div key={index} className="mb-4 pb-2">
                      <div className="flex items-center">
                        <a
                          href={source.url}
                          className="inline-flex size-4 items-center justify-center rounded-full bg-gray-600"
                        >
                          <span className="text-xs">1</span>
                        </a>
                        {"\u00A0"}
                        <p className="truncate text-sm">
                          {source.url
                            .replace("https://", "")
                            .replaceAll("/", " > ")}
                        </p>
                      </div>
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-base text-blue-400 hover:underline"
                      >
                        {source.title}
                      </a>
                      <p className="overflow-wrap text-sm">
                        {source.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      ))}
      <div className="container fixed bottom-5 left-[50%] flex max-w-lg translate-x-[-50%] gap-12 px-6 md:left-auto md:max-w-6xl md:translate-x-0 md:px-0">
        <div className="group mx-2 flex w-full flex-col rounded-2xl">
          <div className="flex items-center rounded-lg border-2 transition-all duration-300 ">
            <PromptForm
              onSubmit={async (value) => {
                await append({
                  content: value,
                  role: "user",
                })
              }}
              input={input}
              setInput={setInput}
              isLoading={isLoading}
            />
          </div>
        </div>
        <div className="hidden w-[33%] shrink-0 md:block"></div>
      </div>
    </div>
  )
}
