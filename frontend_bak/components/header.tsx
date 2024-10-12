import * as React from 'react'
import Link from 'next/link'

import { ModeToggle } from '@/components/mode-toggle'
import { Account } from '@/components/account'

import { auth, signOut } from '@/auth'
import { Button } from '@/components/ui/button'
import { SidebarMobile } from '@/components/sidebar-mobile'
import { ChatHistory } from '@/components/chat-history'
import { Session } from '@/lib/types'
import { ModelSelection } from '@/components/model-selection'

async function SidebarSection() {
  const session = (await auth()) as Session
  return (
    <>
      {session?.user && (
        <>
          <SidebarMobile>
            <ChatHistory userId={session.user.id} />
          </SidebarMobile>
        </>
      )}
    </>
  )
}

export async function Header() {
  const session = (await auth()) as Session
  return (
    <header className="sticky top-0 z-50 flex items-center justify-between w-full h-14 px-4 shrink-0 bg-secondary">
      <div className="flex items-center">
        <React.Suspense fallback={<div className="flex-1 overflow-auto" />}>
          <SidebarSection />
        </React.Suspense>
        {session?.user && <ModelSelection />}
      </div>
      <div className="flex items-center justify-end space-x-2">
        <React.Suspense fallback={<div className="flex-1 overflow-auto" />}>
          <div className="flex items-center">
            {!session?.user ? (
              <Button variant="link" asChild className="-ml-2">
                <Link href="/login">Login</Link>
              </Button>
            ) : (
              <Account
                user={session?.user}
                signOut={async () => {
                  'use server'
                  await signOut()
                }}
              />
            )}
            <ModeToggle />
          </div>
        </React.Suspense>
      </div>
    </header>
  )
}
