import Link from "next/link"

import { siteConfig } from "@/config/site"
import { buttonVariants } from "@/components/ui/button"
import { Search } from "@/components/search"

export default function IndexPage() {
  return (
    // Ensuring the main container allows for full height alignment
    <section className="container mx-auto flex min-h-full flex-col items-center justify-center p-4 pb-10">
      <Search />
    </section>
  )
}
