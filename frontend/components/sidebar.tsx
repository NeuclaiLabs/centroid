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
      className={cn(className, 'h-screen flex-col dark:bg-zinc-950 ')}
    >
      <aside
        className={`peer inset-y-0  z-30 flex  border-r flex-col  border-r   duration-300 ease-in-out data-[state=open]:translate-x-0 ${
          !isSidebarOpen ? 'lg:flex lg:w-[250px] xl:w-[300px]' : 'w-0'
        }`}
      >
        {children}
      </aside>
    </div>
  )
}
