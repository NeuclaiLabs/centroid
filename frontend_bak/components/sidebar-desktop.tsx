import { Sidebar } from '@/components/sidebar'

import { auth } from '@/auth'
import { ChatHistory } from '@/components/chat-history'

export async function SidebarDesktop() {
  const session = await auth()

  if (!session?.user?.id) {
    return null
  }

  return (
    <Sidebar>
      {/* @ts-ignore */}
      <ChatHistory userId={session.user.id} />
    </Sidebar>
  )
}
