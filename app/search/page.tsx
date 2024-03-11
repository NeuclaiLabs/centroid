"use client"

import { useSearchParams } from "next/navigation"

import { Conversation } from "@/components/conversation"

export default function IndexPage() {
  const searchParams = useSearchParams()
  return (
    // Ensuring the main container allows for full height alignment
    <section className="container mx-auto flex min-h-full flex-col  p-4 pb-10">
      <Conversation />
    </section>
  )
}
