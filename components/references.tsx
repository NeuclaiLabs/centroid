export function References() {
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

    {
      url: "https://tailwindcss.com/docs/grid-template-columns",

      title: "Grid Template Columns",

      description:
        "By default, Tailwind includes grid-template-column utilities for creating basic grids with up to 12 equal width columns. You can customize these values by.Tailwind CSS grid generator is a tool that helps developers create custom Tailwind grid layouts more easily. The generator allows users to specify the number..",
    },
  ]
  return (
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
      </div>
    </div>
  )
}
