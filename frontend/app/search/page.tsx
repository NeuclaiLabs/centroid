"use client"

import { Suspense } from "react"

import { Skeleton } from "@/components/ui/skeleton"
import { Conversation } from "@/components/conversation"

export default function IndexPage() {
  return (
    <div className="container mx-auto flex min-h-full flex-col  overflow-x-auto p-4 pb-10">
      <Suspense>
        <Conversation />
      </Suspense>
    </div>
  )
}
