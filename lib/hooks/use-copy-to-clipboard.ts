import { useEffect, useState } from "react"

export function useCopyToClipboard(resetDuration = 1000) {
  const [copiedText, setCopiedText] = useState("")
  const [isCopied, setIsCopied] = useState(false)

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedText(text)
      setIsCopied(true)
    } catch (err) {
      console.error("Failed to copy text: ", err)
      setIsCopied(false)
    }
  }

  useEffect(() => {
    let timer: NodeJS.Timeout | undefined
    if (isCopied) {
      timer = setTimeout(() => {
        setIsCopied(false)
      }, resetDuration)
    }
    return () => clearTimeout(timer)
  }, [isCopied, resetDuration])

  return { copiedText, isCopied, copyToClipboard }
}
