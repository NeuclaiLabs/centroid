import React from "react"

import useSearchResults from "@/lib/hooks/use-search-results"
import { Skeleton } from "@/components/ui/skeleton"

interface Source {
  title: string
  url: string
  description: string
}

export function References() {
  const searchQuery = "nodejs"
  const { sources, isLoading, error } = useSearchResults(searchQuery)

  return (
    <div className="col-span-1 flex flex-col p-4">
      <div className="rounded-md">
        <h2 className="mb-2 text-lg font-bold">SOURCES</h2>
        {isLoading ? (
          <>
            <Skeleton className="mb-2  h-6 w-2/3 " />
            <Skeleton className="mb-2  h-6 w-full " />
            <Skeleton className="mb-2  h-6 w-2/3 " />
          </>
        ) : (
          sources.map((source, index) => (
            <div key={index} className="mb-4 pb-2">
              <div className="flex items-center">
                <a
                  href={source.url}
                  className="inline-flex size-4 items-center justify-center rounded-full bg-gray-600"
                >
                  <span className="text-xs">{index + 1}</span>
                </a>
                {"\u00A0"}
                <p className="truncate text-sm">
                  {source.url.replace("https://", "").replaceAll("/", " > ")}
                </p>
              </div>
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-base text-blue-400 hover:underline"
              >
                {source.title}
              </a>
              <p className="overflow-wrap text-sm">{source.description}</p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
