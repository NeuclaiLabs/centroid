import { auth } from '@/auth'
import LoginForm from '@/components/login-form'
import { Session } from '@/lib/types'
import { redirect } from 'next/navigation'
import { Settings } from '@/components/settings'

export default async function IndexPage() {
  const session = (await auth()) as Session

  if (!session) {
    redirect('/login')
  }

  return (
    <main className="flex flex-col p-4">
      <Settings userId={session.user?.id} />
    </main>
  )
}
