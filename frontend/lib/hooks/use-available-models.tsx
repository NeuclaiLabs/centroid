'use client'
import { useState, useEffect } from 'react'
import { getConnections } from '@/app/actions'
import { cache } from 'react'
import { Connection, Model } from '@/lib/types'

const loadConnections = cache(async (userId?: string) => {
  return await getConnections()
})

const fetchModelsByProvider = cache(
  async (connection: Connection): Promise<Model[]> => {
    switch (connection.type) {
      case 'openai':
        return [
          { id: connection.id + '/gpt-3.5-turbo-0125', connection },
          { id: connection.id + '/gpt-4-turbo', connection },
          { id: connection.id + '/gpt-3.5-turbo', connection }
        ]
      case 'groq':
        return [
          { id: connection.id + '/llama3-8b-8192', connection },
          { id: connection.id + '/llama3-70b-8192', connection },
          { id: connection.id + '/mixtral-8x7b-32768', connection },
          { id: connection.id + '/gemma-7b-it', connection }
        ]
      case 'ollama':
        const response = await fetch(`${connection.data.url}/api/tags`)
        const records = (await response.json())['models']
        return records.map((model: { name: String }) => ({
          id: connection.id + "/" + model.name,
          connection
        }))
      default:
        return []
    }
  }
)

export const useAvailableModels = (): Model[] => {
  const [availableModels, setAvailableModels] = useState<Model[]>([])

  useEffect(() => {
    const fetchAvailableModels = async () => {
      try {
        const connections: Connection[] = await loadConnections()
        const models = await Promise.all(
          connections.map(async connection => {
            return (await fetchModelsByProvider(connection)).map(record => ({
              ...record,
              name: record.id.split("/", 2)[1]
            }))
          })
        )
        setAvailableModels(models.flat())
      } catch (error) {
        console.error('Error fetching available models:', error)
        setAvailableModels([])
      }
    }

    fetchAvailableModels()
  }, [])

  return availableModels
}
