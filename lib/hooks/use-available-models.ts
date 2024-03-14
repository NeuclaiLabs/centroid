import { useEffect, useState } from "react"
import { z } from "zod"

import { apiConfigSchema, useApiConfig } from "@/lib/hooks/use-api-config"

type ApiConfig = z.infer<typeof apiConfigSchema>
const modelsByProvider = {
  OpenAI: ["GPT-3.5", "GPT-4"],
  Anthropic: ["Claude"],
  Groq: [],
} as const

const dynamicModelProviders = ["Ollama", "LMStudio"]

// Type for the modelsByProvider object
type ModelsByProvider = typeof modelsByProvider

// Type for the function return value
type AvailableModels = string[]

export function useAvailableModels() {
  const { storedData } = useApiConfig()
  const [availableModels, setAvailableModels] = useState<AvailableModels>([])

  useEffect(() => {
    // Calculate available models based on the provided API config
    const models: Set<string> = new Set()

    storedData.providers.map(
      (providerConfig: ApiConfig["providers"][number]) => {
        const providerModels =
          modelsByProvider[providerConfig.provider as keyof ModelsByProvider] ||
          []
        providerModels.map((model) => models.add(model))
      }
    )

    setAvailableModels(Array.from(models))
  }, [storedData]) // Re-calculate when apiConfig changes

  useEffect(() => {
    // Fetch dynamic models from the endpoint
    console.log("called once")
    const fetchDynamicModels = async () => {
      try {
        const dynamicModels: Set<string> = new Set(availableModels)
        const dynamicProviders = storedData.providers.filter(
          (provider: { provider: string }) =>
            dynamicModelProviders.includes(provider.provider)
        )
        if (dynamicProviders.length > 0) {
          for (const provider of dynamicProviders) {
            const response = await fetch(`${provider.url}/api/tags`)
            const providerModels = (await response.json()).models.map(
              (record: { name: any }) => record.name
            )
            providerModels.map((model: string) => dynamicModels.add(model))
          }
        }
        // Update the availableModels state with the fetched dynamic models
        setAvailableModels(Array.from(dynamicModels))
      } catch (error) {
        console.error("Error fetching dynamic models:", error)
      }
    }
    fetchDynamicModels()
  }, [storedData]) // Re-fetch dynamic models when apiConfig changes

  return availableModels
}
