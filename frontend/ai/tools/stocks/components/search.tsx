interface Result {
  description: string
}
export function Search({ props: results }: { props: Result[] }) {
  return (
    <div className="-mt-2 flex w-full flex-col gap-2 py-4">
      <div className="flex shrink-0 flex-col gap-1 rounded-lg bg-zinc-800 p-4">
        <div className="text-sm text-zinc-400">
          Search for: {JSON.stringify(results)}
        </div>
      </div>
    </div>
  )
}
