import { SidebarToggle } from '@/components/sidebar-toggle'

interface ChatLayoutProps {
  children: React.ReactNode
}

export default async function SettingsLayout({ children }: ChatLayoutProps) {
  return (
    <div className="relative flex h-[calc(100vh_-_theme(spacing.16))] bg-secondary overflow-hidden">
      <div className="flex items-center pb-16 pl-2">
        <SidebarToggle />
      </div>
      {children}
    </div>
  )
}
