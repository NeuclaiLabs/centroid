'use client'
import * as React from 'react'
import { useState } from 'react'
import { useSidebar } from '@/lib/hooks/use-sidebar'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent
} from '@/components/ui/tooltip'
import {
  IconCaretLeft,
  IconCaretRight,
  IconVerticalLine
} from '@/components/ui/icons'

export function SidebarToggle() {
  const { isSidebarOpen, toggleSidebar } = useSidebar()
  const [hovered, setHovered] = useState(false)

  const handleMouseEnter = () => {
    setHovered(true)
  }

  const handleMouseLeave = () => {
    setHovered(false)
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          className="-ml-2 hidden size-9 p-0 lg:flex"
          onClick={() => {
            toggleSidebar()
          }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {hovered ? (
            isSidebarOpen ? (
              <IconCaretRight />
            ) : (
              <IconCaretLeft />
            )
          ) : (
            <IconVerticalLine />
          )}
          <span className="sr-only">Toggle Sidebar</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        {isSidebarOpen ? 'Open Sidebar' : 'Close Sidebar'}
      </TooltipContent>
    </Tooltip>
  )
}
