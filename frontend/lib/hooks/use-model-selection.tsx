import React, { createContext, useState } from 'react'
import type { Model } from '@/lib/types'
import { useAvailableModels } from '@/lib/hooks/use-available-models'

interface ModelSelectionContextProps {
  selectedModel: Model | null
  updateSelectedModel: (modelId: string | null) => void
}

export const ModelSelectionContext = createContext<ModelSelectionContextProps>({
  selectedModel: null,
  updateSelectedModel: () => {}
})

interface ModelSelectionProviderProps {
  children: React.ReactNode
}

export const ModelSelectionProvider: React.FC<ModelSelectionProviderProps> = ({
  children
}) => {
  const localStorageKey = 'selectedModel'
  const rawValue =
    typeof window !== 'undefined'
      ? window?.localStorage?.getItem(localStorageKey)
      : null
  const initialValue = rawValue ? JSON.parse(rawValue) : null
  const [selectedModel, setSelectedModel] = useState<Model | null>(initialValue)

  // setSelectedModel(initialValue || null)

  // Retrieve available models
  const availableModels = useAvailableModels()

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

  return (
    <ModelSelectionContext.Provider
      value={{ selectedModel, updateSelectedModel }}
    >
      {children}
    </ModelSelectionContext.Provider>
  )
}
