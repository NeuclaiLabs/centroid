import { Message } from "ai/react"

export function Question({ message }: { message: Message }) {
  return (
    <>
      <div className="break-words rounded-md">
        <h2 className="mb-2 text-xl font-bold">{message.content}</h2>
      </div>
    </>
  )
}
