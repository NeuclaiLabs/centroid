import * as React from 'react'

import Link from 'next/link'

import { cn } from '@/lib/utils'
import { SidebarList } from '@/components/sidebar-list'
import { buttonVariants } from '@/components/ui/button'
import { IconPlus } from '@/components/ui/icons'
import { IconOpenAstra } from '@/components/ui/icons'

interface ChatHistoryProps {
  userId?: string
}

export async function ChatHistory({ userId }: ChatHistoryProps) {
  return (
    <div className="flex flex-col h-screen pt-0">
      <div className="flex items-center justify-between p-2">
        <Link
          href="/"
          className={cn(
            buttonVariants({ variant: 'outline' }),
            'h-10 w-full justify-start p-0 border-none bg-none shadow-none transition-colors hover:bg-zinc-200/40 dark:hover:bg-zinc-300/10'
          )}
        >
          <div className="flex items-center">
            <IconOpenAstra className="size-6 ml-2" />
            <span className="font-bold text-sm pl-2">New Chat</span>
          </div>
          <div className="ml-auto">
            <IconPlus className="size-4 mr-2" />
          </div>
        </Link>
      </div>

      <React.Suspense
        fallback={
          <div className="flex flex-col flex-1 px-4 space-y-4 overflow-auto">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="w-full h-6 rounded-md shrink-0 animate-pulse bg-zinc-200 dark:bg-zinc-800"
              />
            ))}
          </div>
        }
      >
        {/* @ts-ignore */}
        <SidebarList userId={userId} />
      </React.Suspense>
    </div>
  )
}
