"use client"

import { useChat } from "ai/react"

import { Conversation } from "@/components/conversation"

export default function IndexPage() {
  const { messages, input, handleInputChange, handleSubmit } = useChat()

  return (
    // Ensuring the main container allows for full height alignment
    <section className="container mx-auto flex min-h-full flex-col  p-4 pb-10">
      <div>
        <ul>
          {messages.map((m, index) => (
            <li key={index}>
              {m.role === "user" ? "User: " : "AI: "}
              {m.content}
            </li>
          ))}
        </ul>

        <form onSubmit={handleSubmit}>
          <label>
            Say something...
            <input value={input} onChange={handleInputChange} />
          </label>
          <button type="submit">Send</button>
        </form>
      </div>
      {/* <Conversation /> */}
    </section>
  )
}
