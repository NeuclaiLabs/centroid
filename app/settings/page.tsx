import { Separator } from "@/components/ui/separator"
import { ApiConfigForm } from "@/components/settings-form"

export default function IndexPage() {
  return (
    // Ensuring the main container allows for full height alignment
    <div className="container mx-auto flex min-h-full flex-col  p-6 pb-10">
      <h2 className="pb-10 text-2xl font-bold">Settings</h2>
      <div className="w-full lg:w-3/5">
        {/* Set width to 60% on large screens */}
        <ApiConfigForm />
      </div>
    </div>
  )
}
