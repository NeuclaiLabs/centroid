import { useEffect, useState } from "react"

interface Source {
  title: string
  url: string
  description: string
}

const useSearchResults = (searchQuery: string) => {
  const [sources, setSources] = useState<Source[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchSearchResults = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(searchQuery)}`
        )
        const data = await response.json()
        setSources(data.sources)
      } catch (err) {
        setError(err as Error)
      } finally {
        console.log(sources)
        setIsLoading(false)
      }
    }

    if (searchQuery) {
      fetchSearchResults()
    }
  }, [searchQuery])

  return { sources, isLoading, error }
}

export default useSearchResults
