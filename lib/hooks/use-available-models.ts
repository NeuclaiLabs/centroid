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
    const fetchAvailableModels = async () => {
      try {
        const models: Set<string> = new Set()

        // Fetch dynamic models
        const dynamicModelsPromises = storedData.providers.map(
          async (providerConfig: ApiConfig["providers"][number]) => {
            if (dynamicModelProviders.includes(providerConfig.provider)) {
              const response = await fetch(`${providerConfig.url}/api/tags`)
              const providerModels = (await response.json()).models.map(
                (record: { name: any }) => record.name
              )
              providerModels.forEach((model: string) => models.add(model))
            }
          }
        )

        await Promise.all(dynamicModelsPromises)

        // Add static models
        storedData.providers.forEach(
          (providerConfig: ApiConfig["providers"][number]) => {
            const providerModels =
              modelsByProvider[
                providerConfig.provider as keyof ModelsByProvider
              ] || []
            providerModels.forEach((model) => models.add(model))
          }
        )

        // Update available models
        setAvailableModels(Array.from(models))
      } catch (error) {
        console.error("Error fetching available models:", error)
      }
    }

    fetchAvailableModels()
  }, [storedData])

  return availableModels
}
