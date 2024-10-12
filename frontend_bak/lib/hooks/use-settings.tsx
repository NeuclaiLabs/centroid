import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode
} from 'react'
import { auth } from '@/auth'

import { Settings } from '@/lib/types'
import { fetcher } from '../utils'
import { cache } from 'react'
import { getSettings, saveSettings } from '@/app/actions'

const SettingsContext = createContext<any | undefined>(undefined)

const fetchSettings = async () => {
  const loadSettings = cache(async (userId?: string) => {
    return await getSettings()
  })
  return await loadSettings()
}

const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<Settings>({
    id: '',
    data: { general: {} }
  })

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const loadedSettings = await fetchSettings()
        setSettings(loadedSettings)
      } catch (error) {
        console.error('Failed to load settings:', error)
      }
    }

    loadSettings()
  }, [])

  const updateSettings = async (type: string, newSettings: any) => {
    const updatedSettings = {
      ...settings,
      data: {
        ...settings.data,
        [type]: {
          ...newSettings
        }
      }
    }
    setSettings(updatedSettings)
    try {
      await saveSettings(updatedSettings)
    } catch (error) {
      console.error('Failed to save settings:', error)
    }
  }

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  )
}

const useSettings = () => {
  const context = useContext(SettingsContext)
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return context
}

export { SettingsProvider, useSettings }
