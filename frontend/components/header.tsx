import * as React from 'react'
import Link from 'next/link'

import { ThemeToggle } from '@/components/theme-toggle'
import { ModeToggle } from '@/components/mode-toggle'

import { auth } from '@/auth'
import { Button, buttonVariants } from '@/components/ui/button'
import { UserMenu } from '@/components/user-menu'
import { SidebarMobile } from '@/components/sidebar-mobile'
import { ChatHistory } from '@/components/chat-history'
import { Session } from '@/lib/types'

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

async function UserOrLogin() {
  const session = (await auth()) as Session
  return (
    <>
      <div className="flex items-center">
        <ModeToggle />
        {session?.user ? (
          <></>
        ) : (
          <Button variant="link" asChild className="-ml-2">
            <Link href="/login">Login</Link>
          </Button>
        )}
      </div>
    </>
  )
}

export function Header() {
  return (
    <header className="sticky top-0 z-50 flex items-center justify-between w-full h-14 px-4  shrink-0 bg-secondary ">
      <div className="flex items-center">
        <React.Suspense fallback={<div className="flex-1 overflow-auto" />}>
          <SidebarSection />
        </React.Suspense>
      </div>
      <div className="flex items-center justify-end space-x-2">
        <React.Suspense fallback={<div className="flex-1 overflow-auto" />}>
          <UserOrLogin />
        </React.Suspense>
        {/* <a
          target="_blank"
          href="https://github.com/vercel/nextjs-ai-chatbot/"
          rel="noopener noreferrer"
          className={cn(buttonVariants({ variant: 'outline' }))}
        >
          <IconGitHub />
          <span className="hidden ml-2 md:flex">GitHub</span>
        </a>
        <a
          href="https://vercel.com/templates/Next.js/nextjs-ai-chatbot"
          target="_blank"
          className={cn(buttonVariants())}
        >
          <IconVercel className="mr-2" />
          <span className="hidden sm:block">Deploy to Vercel</span>
          <span className="sm:hidden">Deploy</span>
        </a> */}
      </div>
    </header>
  )
}
