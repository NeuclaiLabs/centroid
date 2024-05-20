'use client'

import { type Session } from '@/lib/types'
import Link from 'next/link'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'

import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'

import { Settings } from '@/components/settings'
import { useState } from 'react'

function getUserInitials(name: string) {
  const [firstName, lastName] = name.split(' ')
  return lastName ? `${firstName[0]}${lastName[0]}` : firstName.slice(0, 2)
}

export interface AccountProps {
  user: Session['user']
  signOut: () => Promise<void>
}

export function Account({ user, signOut }: AccountProps) {
  enum Dialogs {
    dialog1 = 'dialog1',
    dialog2 = 'dialog2'
  }

  const [dialog, setDialog] = useState()
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className={cn(
              buttonVariants({ variant: 'ghost' }),
              ' transition-colors hover:bg-zinc-200/40 dark:hover:bg-zinc-300/10'
            )}
          >
            <div className="flex size-4 shrink-0 select-none items-center justify-center rounded-full bg-muted/50 text-xs font-medium uppercase text-muted-foreground">
              {getUserInitials(user.email)}
            </div>
            {/* <span className="ml-2 hidden md:block">{user.email}</span> */}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-60">
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <Link href="/settings">
              <DropdownMenuItem>Settings</DropdownMenuItem>
            </Link>
          </DropdownMenuGroup>
          <Link
            href="https://github.com/srikanth235/openastra"
            target="_blank"
            rel="noopener noreferrer"
          >
            <DropdownMenuItem>GitHub</DropdownMenuItem>
          </Link>
          <DropdownMenuItem>Discord</DropdownMenuItem>
          <DropdownMenuItem disabled>API</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={async () => {
              await signOut()
            }}
          >
            Sign Out
            <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )
}
