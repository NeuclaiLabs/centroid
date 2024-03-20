import React, { useCallback, useEffect, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import { useChat } from "ai/react"

import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Answer } from "@/components/answer"
import { PromptForm } from "@/components/prompt-form"
import { Question } from "@/components/question"
import { References } from "@/components/references"

export function Conversation() {
  const searchParams = useSearchParams()
  const searchQuery = decodeURIComponent(searchParams.get("q") || "")
  const lastSeparatorRef: React.MutableRefObject<HTMLElement | null> =
    useRef(null)

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

  const setSeparatorRef = useCallback((node: HTMLElement | null) => {
    if (node !== null) {
      lastSeparatorRef.current = node
    }
  }, [])
  const effectRanOnce = useRef(false)

  useEffect(() => {
    if (!effectRanOnce.current) {
      effectRanOnce.current = true
      append({ role: "user", content: searchQuery })
    }
  }, [searchQuery, append])

  useEffect(() => {
    // Scroll to the top of the page when a new question is displayed
    if (messages.length > 0 && messages[messages.length - 1].role === "user") {
      lastSeparatorRef?.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      })
    }
  }, [messages])

  return (
    <div>
      {messages.map((message, index) => (
        <React.Fragment key={index}>
          <div className="grid gap-4 lg:grid-cols-3" key={index}>
            {index % 2 === 0 ? (
              <div>
                <Question message={message} />
              </div>
            ) : (
              <>
                <Answer message={message} isLoading={isLoading} />
                <References />
                <Separator
                  className="col-span-3"
                  ref={index === messages.length - 1 ? setSeparatorRef : null}
                />
              </>
            )}
          </div>
        </React.Fragment>
      ))}
      {messages.length % 2 !== 0 && isLoading && (
        <div>
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="col-span-1 rounded-md p-4 lg:col-span-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="mb-2 h-6 w-full" />
              <Skeleton className="mb-2 h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="mb-2 h-6 w-full" />
              <Skeleton className="mb-2 h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="mb-2 h-6 w-full" />
              <Skeleton className="mb-2 h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="mb-2 h-6 w-full" />
              <Skeleton className="mb-2 h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="mb-2 h-6 w-full" />
              <Skeleton className="mb-2 h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="mb-2 h-6 w-full" />
              <Skeleton className="mb-2 h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="mb-2 h-6 w-full" />
              <Skeleton className="mb-2 h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="mb-2 h-6 w-full" />
              <Skeleton className="mb-2 h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
            {/* <div className="col-span-1  p-4">
              <div className="rounded-md ">
                <Skeleton className="mb-2 h-5 w-full" />
                <Skeleton className="mb-2 h-6 w-full" />
                <Skeleton className="mb-2 h-6 w-full" />
              </div>
            </div> */}
          </div>
        </div>
      )}
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
