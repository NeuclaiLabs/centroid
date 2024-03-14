import { Separator } from "@/components/ui/separator"
import { SettingsForm } from "@/components/settings-form"

export default function IndexPage() {
  return (
    // Ensuring the main container allows for full height alignment
    <div className="container mx-auto flex min-h-full flex-col  p-6 pb-10">
      <h2 className="text-xl font-medium pb-10">Settings</h2>
      <div className="w-full lg:w-3/5">
        {/* Set width to 60% on large screens */}
        <SettingsForm />
      </div>
    </div>
  )
}
