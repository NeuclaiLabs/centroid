import { clearChats, getChats } from '@/app/actions'
import { ClearHistory } from '@/components/clear-history'
import { SidebarItems } from '@/components/sidebar-items'
import { ThemeToggle } from '@/components/theme-toggle'
import { Account } from '@/components/account'
import { auth, signOut } from '@/auth'
import { cache } from 'react'
import { type Session } from '@/lib/types'

interface SidebarListProps {
  userId?: string
  children?: React.ReactNode
}

const loadChats = cache(async (userId?: string) => {
  return await getChats(userId)
})

export async function SidebarList({ userId }: SidebarListProps) {
  const chats = await loadChats(userId)
  const session = (await auth()) as Session

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex-1 overflow-auto">
        {chats?.length ? (
          <div className="space-y-2 px-2 pt-2">
            <SidebarItems chats={chats} />
          </div>
        ) : (
          <div className="p-8 text-center">
            <p className="text-sm text-muted-foreground">No chat history</p>
          </div>
        )}
      </div>
      <div className="flex flex-col p-2">
        <div className="flex flex-1 flex-col">
          <Account
            user={session?.user}
            signOut={async () => {
              'use server'
              await signOut()
            }}
          />
          {/* <ThemeToggle className="mt-2 mb-4"/>
          <ClearHistory clearChats={clearChats}> */}
        </div>
        {/* <div className="flex items-center justify-between">
          <ThemeToggle />
          <ClearHistory clearChats={clearChats} isEnabled={chats?.length > 0} />
        </div> */}
      </div>
    </div>
  )
}
