import React from "react"

import { Skeleton } from "@/components/ui/skeleton"

interface Source {
  title: string
  url: string
  description: string
}

export function References({ sources }: { sources?: Source[] }) {
  return (
    <div className="break-words rounded-md">
      <h2 className="mb-2 text-lg font-bold">SOURCES</h2>
      {sources!.map((source, index) => (
        <div key={index} className="mb-4 pb-2">
          <div className="flex items-center">
            <a
              href={source.url}
              className="inline-flex size-4 items-center justify-center rounded-full bg-secondary"
            >
              <span className="text-xs">{index + 1}</span>
            </a>
            {"\u00A0"}
            <p className="overflow-wrap text-sm">
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
      ))}
    </div>
  )
}
