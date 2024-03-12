"use client"

import React, { ChangeEvent, useState } from "react"
import { useRouter } from "next/navigation"

import { AutosizeTextarea } from "@/components/ui/autosize-textarea"
import { Icons } from "@/components/icons"

export function Search() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [addSearchToContext, setaddSearchToContext] = useState<boolean>(false)
  const onButtonClick = () => {
    router.push("/search?q=" + searchQuery.trim())
  }
  const Button = ({ text }: { text: string }) => {
    return (
      <button
        onClick={onButtonClick}
        className=" focus:shadow-outline rounded-lg px-4 py-2 shadow-md transition"
      >
        {text}
      </button>
    )
  }

  const ButtonContainer = () => {
    return (
      <div className="flex w-3/5 flex-wrap items-center justify-center gap-4 overflow-hidden truncate p-4 text-sm">
        <Button text="What's new in NextJS 14?" />
        <Button text="Where to download Mistral model ?" />
        <Button text="How to get user agent from Vercel Edge Function?" />
        {/* <Button text="How can I know if my website was scraped?" /> */}
      </div>
    )
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
              <div>
                <div
                  className="flex items-center"
                  aria-haspopup="menu"
                  aria-expanded="false"
                  data-state="closed"
                >
                  <button
                    className="text-default-500 flex h-9 items-center justify-center space-x-1 rounded-full p-2 text-sm"
                    data-state="closed"
                  >
                    <Icons.chevron />
                    <span>Default</span>
                  </button>
                </div>
              </div>
              <div></div>
            </div>
          </div>
        </div>
        <ButtonContainer />
      </div>
    </div>
  )
}
