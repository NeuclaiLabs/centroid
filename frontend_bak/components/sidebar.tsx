'use client'

import * as React from 'react'

import { useSidebar } from '@/lib/hooks/use-sidebar'
import { cn } from '@/lib/utils'

export interface SidebarProps extends React.ComponentProps<'div'> {}

export function Sidebar({ className, children }: SidebarProps) {
  const { isSidebarOpen, isLoading } = useSidebar()

  return (
    <div
      data-state={isSidebarOpen && !isLoading ? 'open' : 'closed'}
      className={cn(className, 'h-screen flex-col dark:bg-zinc-950')}
    >
      <div
        className={`peer inset-y-0 z-30 shrink-0 w-[260px] flex flex-col border-r  transition-all duration-300 ${
          isSidebarOpen ? '-ml-72' : ''
        }`}
      >
        {children}
      </div>
    </div>
  )
}
