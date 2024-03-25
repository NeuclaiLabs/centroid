import { Search } from "@/components/search"

export default function IndexPage() {
  return (
    // Ensuring the main container allows for full height alignment
    <div className="container mx-auto flex w-full flex-1 items-center justify-center p-2 pb-8">
      <Search />
    </div>
  )
}
