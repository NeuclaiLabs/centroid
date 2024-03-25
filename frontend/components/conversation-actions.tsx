"use client"

// ButtonGroup.tsx
import React from "react"

import { Icons } from "@/components/icons"

interface ButtonProps {
  icon: React.ReactNode
  onClick?: () => void
}

const Button: React.FC<ButtonProps> = ({ icon, onClick }) => {
  return (
    <button
      className="flex size-4 items-center justify-center focus:outline-none"
      onClick={onClick}
    >
      {icon}
    </button>
  )
}

export function ConversationActions({ reload }: { reload: () => void }) {
  return (
    <div className="flex items-center space-x-4 pt-4">
      <Button icon={<Icons.refresh className="size-4" />} onClick={reload} />
      <Button icon={<Icons.thumbsUp className="size-4" />} />
      <Button icon={<Icons.thumbsDown className="size-4" />} />
    </div>
  )
}
