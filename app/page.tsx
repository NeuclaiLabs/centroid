import { Search } from "@/components/search"

export default function IndexPage() {
  return (
    // Ensuring the main container allows for full height alignment
    <div className="container mx-auto flex w-full flex-1 items-center justify-center">
      <section className=" flex min-h-full flex-col items-center justify-center p-4 pb-10">
        <Search />
      </section>
    </div>
  )
}
