import { SiteHeader } from "@/components/site-header"

export default function DashboardLayout({
  children, // will be a page or nested layout
}: {
  children: React.ReactNode
}) {
  return (
    <section>
      {/* Include shared UI here e.g. a header or sidebar */}
      <nav><SiteHeader/></nav>

      {children}
    </section>
  )
}
