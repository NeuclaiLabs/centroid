"use client"

import { useEffect, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { useChat } from "ai/react"

import { Button, buttonVariants } from "@/components/ui/button"
import { ButtonScrollToBottom } from "@/components/button-scroll-to-bottom"
import { Conversation } from "@/components/conversation"
import { IconRefresh, IconStop } from "@/components/icons"

export default function IndexPage() {
  const searchParams = useSearchParams()
  const searchQuery = decodeURIComponent(searchParams.get("q") || "")

  // append({ role: "user", content: "hi" })
  return (
    <section className="container mx-auto flex min-h-full flex-col  p-4 pb-10">
      <Conversation searchQuery={searchQuery} />
      {/* <div className="fixed inset-x-0 bottom-0 w-full pb-20">
        <ButtonScrollToBottom />
        <div className="mx-auto sm:max-w-2xl sm:px-4">
          <div className="flex h-12 items-center justify-center">
            {isLoading ? (
              <Button
                variant="outline"
                onClick={() => stop()}
                className="bg-background"
              >
                <IconStop className="mr-2" />
                Stop generating
              </Button>
            ) : (
              messages?.length >= 2 && (
                <div className="flex space-x-2">
                  <Button variant="outline" onClick={() => reload()}>
                    <IconRefresh className="mr-2" />
                    Regenerate response
                  </Button>
                </div>
              )
            )}
          </div>
        </div>
      </div> */}
    </section>
  )
}
