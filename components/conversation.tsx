import React from "react"

export function Conversation() {
  const sources = [
    {
      url: "https://www.speedtest.net",
      description: "Speedtest by Ookla - The Global Broadband Speed Test",
    },
    {
      url: "https://fast.com",
      description: "Internet Speed Test | Fast.com",
    },
    // Add more sources as needed
  ]
  return (
    <div className="flex flex-col md:flex-row">
      <div className="p-4 md:w-70">
        <div className="rounded-md p-4 ">
          <p>Random text</p>
        </div>
      </div>
      <div className="p-4 md:w-30">
        <div className="rounded-md p-4 ">
          <h2 className="mb-2 text-lg font-bold">SOURCES</h2>
          {sources.map((source, index) => (
            <div key={index} className="mb-4">
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline"
              >
                {index + 1}. {source.url}
              </a>
              <p>{source.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
