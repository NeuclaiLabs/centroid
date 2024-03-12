import * as React from "react"

import { cn } from "@/lib/utils"

interface AutosizeTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  maxHeight?: number
  minHeight?: number
}

export const AutosizeTextarea = React.forwardRef<
  HTMLTextAreaElement,
  AutosizeTextareaProps
>(
  (
    {
      minHeight = 52,
      maxHeight = Number.MAX_SAFE_INTEGER,
      className,
      onChange,
      value,
      ...props
    },
    forwardedRef
  ) => {
    const internalTextAreaRef = React.useRef<HTMLTextAreaElement>(null)
    const textAreaRef = (forwardedRef ??
      internalTextAreaRef) as React.MutableRefObject<HTMLTextAreaElement | null>

    // Shadow ref to calculate height
    const shadowRef = React.useRef<HTMLTextAreaElement>(null)

    const adjustHeight = () => {
      if (textAreaRef.current && shadowRef.current) {
        shadowRef.current.style.width = `${textAreaRef.current.offsetWidth}px` // Match the width of the textarea to ensure scroll height calculation is accurate
        shadowRef.current.value = textAreaRef.current.value // Mirror the textarea content
        let newHeight = shadowRef.current.scrollHeight
        newHeight = Math.max(newHeight, minHeight)
        newHeight = Math.min(newHeight, maxHeight)
        textAreaRef.current.style.height = `${newHeight}px`
      }
    }

    // Adjust height when value changes
    React.useEffect(() => {
      adjustHeight()
    }, [value])

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange?.(e)
      adjustHeight()
    }

    return (
      <>
        <textarea
          {...props}
          value={value}
          ref={textAreaRef}
          className={cn(
            "flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          onChange={handleChange}
          style={{
            minHeight: `${minHeight}px`,
            overflow: "hidden",
            resize: "none",
            height: `${minHeight}px`,
          }} // Example className replaced with className prop for simplicity
        />
        {/* Invisible shadow textarea for height calculation */}
        <textarea
          className={className}
          aria-hidden="true"
          ref={shadowRef}
          readOnly
          tabIndex={-1}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            visibility: "hidden",
            height: "0",
            overflow: "hidden",
            transform: "translate(-100%, -100%)",
            zIndex: -1,
          }}
        />
      </>
    )
  }
)

AutosizeTextarea.displayName = "AutosizeTextarea"
