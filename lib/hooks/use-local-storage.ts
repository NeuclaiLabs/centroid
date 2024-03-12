import { useEffect, useState } from "react"

export function useLocalStorage(key: string, defaultValue: string) {
  // Get from local storage then
  // parse stored json or return initialValue
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue
    } catch (error) {
      console.log(error)
      return defaultValue
    }
  })

  // Return a wrapped version of useState's setter function that ...
  // ... persists the new value to localStorage.
  useEffect(() => {
    try {
      const serializedValue = JSON.stringify(storedValue)
      window.localStorage.setItem(key, serializedValue)
    } catch (error) {
      console.log(error)
    }
  }, [key, storedValue])

  return [storedValue, setStoredValue]
}
