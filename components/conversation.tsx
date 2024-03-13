import React from "react"

import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/conversation-actions"
import { Suggestions } from "@/components/suggestions"

export function Conversation() {
  const sources = [
    {
      url: "https://tailwindcss.com/docs/grid-template-columns",

      title: "Grid Template Columns",

      description:
        "By default, Tailwind includes grid-template-column utilities for creating basic grids with up to 12 equal width columns. You can customize these values by.Tailwind CSS grid generator is a tool that helps developers create custom Tailwind grid layouts more easily. The generator allows users to specify the number..",
    },

    {
      url: "https://tailwindcss.com/docs/grid-template-columns",

      title: "Grid Template Columns",

      description:
        "By default, Tailwind includes grid-template-column utilities for creating basic grids with up to 12 equal width columns. You can customize these values by.Tailwind CSS grid generator is a tool that helps developers create custom Tailwind grid layouts more easily. The generator allows users to specify the number..",
    },
  ]

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="col-span-1 p-4 lg:col-span-2">
        <div className="rounded-md ">
          <h2 className="mb-2 text-xl font-bold">Question</h2>
        </div>
      </div>
      <div className="col-span-1">
        <div className="rounded-md "></div>
      </div>
      <div className="col-span-1 p-4 lg:col-span-2">
        <div className="rounded-md ">
          <h2 className="pb-2 font-bold uppercase"> Answer</h2>
          <p className="overflow-wrap  text-base">
            This code creates a grid with 4 equally sized columns and a gap of
            1rem (4 units) between each grid item. The grid-cols utility classes
            are a quick way to define the number of columns in your grid layout,
            where can be any number from 1 to 12, allowing for a wide range of
            grid configurations 1. For more complex grid layouts, you can use
            additional utilities like grid-cols-subgrid to adopt the column
            tracks defined by the items parent. This is useful for creating
            nested grids:
          </p>
          <ButtonGroup /> <Suggestions />
        </div>
      </div>
      <div className="col-span-1 flex p-4">
        <div className="rounded-md ">
          <h2 className="mb-2 text-lg font-bold">SOURCES</h2>
          {sources.map((source, index) => (
            <div key={index} className="mb-4 pb-2">
              <div className="flex items-center">
                <a
                  href={source.url}
                  className="inline-flex size-4 items-center justify-center rounded-full bg-gray-600"
                >
                  <span className="text-xs">1</span>
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
          ))}
        </div>{" "}
      </div>{" "}
    </div>
  )
}
