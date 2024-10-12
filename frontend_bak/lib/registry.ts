import { anthropic } from '@ai-sdk/anthropic'
import { createOpenAI } from '@ai-sdk/openai'
import { experimental_createProviderRegistry as createProviderRegistry } from 'ai'

// Function to initialize the provider registry with API keys
export const initializeRegistry = (openAIApiKey, anthropicApiKey) => {
  return createProviderRegistry({
    // Register provider with prefix and custom setup using passed API keys:
    openai: createOpenAI({
      apiKey: openAIApiKey
    }),
    anthropic: anthropic({
      apiKey: anthropicApiKey
    })
  })
}

// Example usage:
const openAIApiKey = 'your-openai-api-key-here'
const anthropicApiKey = 'your-anthropic-api-key-here'

export const registry = initializeRegistry(openAIApiKey, anthropicApiKey)
