import React from "react"

import { Skeleton } from "@/components/ui/skeleton"

interface Source {
  title: string
  url: string
  description: string
}

export function References({
  isLoading,
  sources,
}: {
  isLoading: boolean
  sources?: Source[]
}) {
  return (
    <>
      <div className="rounded-md">
        <h2 className="mb-2 text-lg font-bold">SOURCES</h2>
        {isLoading ? (
          <>
            <div className="p-4 lg:grid-cols-1">
                <Skeleton className="mb-2  h-4 w-2/3 " />
                <Skeleton className="mb-2  h-4 w-full" />
                <Skeleton className="mb-2  h-4 w-2/3 " />
                <br />

                <Skeleton className="mb-2  h-4 w-2/3 pb-2" />
                <Skeleton className="mb-2  h-4 w-full pb-2" />
                <Skeleton className="mb-2  h-4 w-2/3 pb-2" />
                <br />

                <Skeleton className="mb-2  h-4 w-2/3 pb-2" />
                <Skeleton className="mb-2  h-4 w-full pb-2" />
                <Skeleton className="mb-2  h-4 w-2/3 pb-2" />
                <br />
              </div>
          </>
        ) : (
          sources!.map((source, index) => (
            <div key={index} className="mb-4 pb-2">
              <div className="flex items-center">
                <a
                  href={source.url}
                  className="inline-flex size-4 items-center justify-center rounded-full bg-secondary"
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
    </>
  )
}
