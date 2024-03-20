import { Message } from "ai/react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import remarkMath from "remark-math"

import { CodeBlock } from "@/components/codeblock"
import { ButtonGroup } from "@/components/conversation-actions"
import { Suggestions } from "@/components/suggestions"

interface CodeProps {
  node?: any
  inline?: any
  className?: any
  children?: any
}
export function Answer({
  message,
  isLoading,
}: {
  message: Message
  isLoading: boolean
}) {
  return (
    <>
      <div className="break-words rounded-md">
        {/* <ButtonScrollToBottom /> */}
        <h2 className="pb-2 font-bold uppercase">Answer</h2>
        <ReactMarkdown
          className="prose dark:prose-invert prose-p:leading-relaxed prose-pre:p-0 break-words"
          remarkPlugins={[remarkGfm, remarkMath]}
          components={{
            p({ children }) {
              return <p className="mb-2 last:mb-0">{children}</p>
            },
            code({ node, className, children, ...props }: CodeProps) {
              if (children?.length) {
                if (children[0] == "▍") {
                  return (
                    <span className="mt-1 animate-pulse cursor-default">▍</span>
                  )
                }

                ;(children[0] as string).replace("`▍`", "▍")
              }

              const match = /language-(\w+)/.exec(className || "")
              const codeText = String(children).trim()

              if (!match && codeText.length < 50) {
                return (
                  <code
                    {...props}
                    className="text-bold inline-code bg-secondary"
                  >
                    {children}
                  </code>
                )
              }
              return (
                <>
                  <CodeBlock
                    key={Math.random()}
                    language={(match && match[1]) || "auto"}
                    value={String(children).replace(/\n$/, "")}
                    {...props}
                  />
                </>
              )
            },
          }}
        >
          {message.content}
        </ReactMarkdown>
        <ButtonGroup /> <Suggestions />
      </div>
    </>
  )
}
