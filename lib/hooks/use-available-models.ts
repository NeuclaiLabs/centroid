import { useEffect, useState } from "react"
import { z } from "zod"

import { apiConfigSchema, useApiConfig } from "@/lib/hooks/use-api-config"

type ApiConfig = z.infer<typeof apiConfigSchema>

export type Model = { id: string; name: string; context?: number }
type ModelsByProvider = {
  [provider: string]: Model[]
}
const modelsByProvider: ModelsByProvider = {
  OpenAI: [
    { id: "gpt-3.5", name: "GPT-3.5", context: 100 },
    { id: "gpt-4", name: "GPT-4.0", context: 100 },
  ],
  Anthropic: [
    { id: "claude-sonnet", name: "Sonnet", context: 100 },
    { id: "Opus", name: "Opus", context: 100 },
  ],
  Groq: [],
}

const dynamicModelProviders = ["Ollama", "LMStudio"]

// Type for the function return value
export function useAvailableModels() {
  const { storedConfig } = useApiConfig()
  const [availableModels, setAvailableModels] = useState<Model[]>()

  useEffect(() => {
    const fetchAvailableModels = async () => {
      try {
        let models: Model[] = []

        // Fetch dynamic models
        const dynamicModelsPromises = storedConfig.providers.map(
          async (providerConfig: ApiConfig["providers"][number]) => {
            if (dynamicModelProviders.includes(providerConfig.provider)) {
              const response = await fetch(`${providerConfig.url}/api/tags`)
              const providerModels = (await response.json()).models
              for (const model of providerModels) {
                models.push({
                  id: model.name,
                  name: model.name,
                })
              }
            }
          }
        )

        await Promise.all(dynamicModelsPromises)
        storedConfig.providers.map((providerConfig: { provider: string }) => {
          if (providerConfig.provider in modelsByProvider) {
            models.push(...modelsByProvider[providerConfig.provider])
          }
        })

        // Update available models
        setAvailableModels(models)
      } catch (error) {
        console.error("Error fetching available models:", error)
      }
    }

    fetchAvailableModels()
  }, [storedConfig])

  return availableModels
}
