'use client'
import { useEffect, useState } from 'react'

import { useAvailableModels } from '@/lib/hooks/use-available-models'
import { Connection, Model } from '@/lib/types'

export function useSelectedModel() {
  const localStorageKey = 'selectedModel'
  const rawValue =
    typeof window !== 'undefined'
      ? window?.localStorage?.getItem(localStorageKey)
      : null
  const initialValue = rawValue ? JSON.parse(rawValue) : null

  // Retrieve available models
  const availableModels = useAvailableModels()

  // Define state variable to store selected model
  const [selectedModel, setSelectedModel] = useState<Model | null>(initialValue)

  // Function to update selected model by ID
  const updateSelectedModel = (modelId: string | null) => {
    // Fetch the model using the provided ID
    const newModel =
      availableModels?.find(model => model.id.toLowerCase() === modelId) || null
    setSelectedModel(newModel)
    if (newModel) {
      localStorage.setItem(localStorageKey, JSON.stringify(newModel)) // Store in local storage
    } else {
      localStorage.removeItem(localStorageKey) // Remove from local storage if null
    }
  }

  // Return selected model and function to update it
  return [selectedModel, updateSelectedModel] as const
}
