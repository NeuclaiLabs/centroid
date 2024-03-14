import { useEffect, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { toast } from "@/components/ui/use-toast"

const apiConfigItemSchema = z.object({
  provider: z.enum(["OpenAI", "Groq", "Anthropic", "Ollama"], {
    errorMap: (issue, ctx) => ({
      message: `The provider is not supported. Supported providers are: OpenAI, Groq, Anthropic, Ollama.`,
    }),
  }),
  url: z.string().url({ message: "Invalid URL. Please provide a valid URL." }),
  apiKey: z.string().min(1, { message: "API Key is required." }),
})

export const apiConfigSchema = z.object({
  providers: z.array(apiConfigItemSchema),
})

// Define your default configuration
const defaultConfig = {
  providers: [{ provider: "OpenAI", url: "", apiKey: "" }],
}

export function useApiConfig() {
  // Attempt to retrieve data from localStorage and use the default if not found
  const [storedData, setStoredData] = useState(() => {
    const storedDataRaw = localStorage.getItem("apiConfigData")
    return storedDataRaw ? JSON.parse(storedDataRaw) : defaultConfig
  })

  const form = useForm({
    resolver: zodResolver(apiConfigSchema),
    defaultValues: storedData,
    mode: "onChange",
  })

  // Persist form data to localStorage on form submit
  const onSubmit = form.handleSubmit((data) => {
    localStorage.setItem("apiConfigData", JSON.stringify(data))
    setStoredData(data) // Update the local state with the new data
    // Optionally, you can add more actions here, like showing a notification
    toast({
      title: "Configuration Saved"
    })
  })

  // Automatically update form defaultValues if storedData changes
  useEffect(() => {
    form.reset(storedData)
  }, [storedData, form])

  return { ...form, form, storedData, onSubmit }
}
