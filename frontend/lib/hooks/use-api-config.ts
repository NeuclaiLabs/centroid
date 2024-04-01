import { useEffect, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { toast } from 'sonner'

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
  const [storedConfig, setStoredConfig] = useState(() => {
    const storedConfigRaw =
      typeof window !== "undefined"
        ? window!.localStorage!.getItem("apiConfigData")
        : null
    return storedConfigRaw ? JSON.parse(storedConfigRaw) : defaultConfig
  })

  const form = useForm({
    resolver: zodResolver(apiConfigSchema),
    defaultValues: storedConfig,
    mode: "onChange",
  })

  // Persist form data to localStorage on form submit
  const onSubmit = form.handleSubmit((data) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("apiConfigData", JSON.stringify(data))
    }
    setStoredConfig(data) // Update the local state with the new data
    // Optionally, you can add more actions here, like showing a notification
    toast({
      title: "Configuration Saved",
    })
  })

  // Automatically update form defaultValues if storedConfig changes
  useEffect(() => {
    form.reset(storedConfig)
  }, [storedConfig, form])

  return { ...form, form, storedConfig, onSubmit }
}
