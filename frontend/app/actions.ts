'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { kv } from '@vercel/kv'

import { auth } from '@/auth'
import { type Chat } from '@/lib/types'
import { type Message } from 'ai'

export async function getChats(userId?: string | null) {
  if (!userId) {
    return []
  }

  try {
    const response = await fetch(
      `http://localhost:8080/api/v1/chats/?skip=0&limit=100`,
      {
        method: 'GET',
        headers: {
          accept: 'application/json',
          // @ts-ignore
          Authorization: `Bearer ${(await auth())?.user?.accessToken}`
        }
      }
    )

    if (!response.ok) {
      throw new Error('Network response was not ok')
    }

    const res = await response.json()
    return res['data']
  } catch (error) {
    console.error('There was a problem with your fetch operation:', error)
    return []
  }
}

export async function getChat(id: string, userId: string) {
  const response = await fetch(`http://localhost:8080/api/v1/chats/${id}`, {
    method: 'GET',
    headers: {
      accept: 'application/json',
      // @ts-ignore
      Authorization: `Bearer ${(await auth())?.user?.accessToken}`
    }
  })

  if (!response.ok) {
    return null
  }

  // TODO: SQLMOdel alias broken in backend. Ref: https://github.com/tiangolo/sqlmodel/discussions/725
  const chat = await response.json().then(data => {
    return {
      ...data,
      userId: data.user_id,
      user_id: undefined,
      messages: data.messages.map((message: Message) => ({
        ...message,
        name: message.name || undefined
      }))
    }
  })

  delete chat.user_id


  if (!chat || (userId && chat.userId !== userId)) {
    return null
  }

  return chat
}

export async function removeChat({ id, path }: { id: string; path: string }) {
  const session = await auth()

  if (!session) {
    return { error: 'Unauthorized' }
  }

  const response = await fetch(`http://localhost:8080/api/v1/chats/${id}`, {
    method: 'DELETE',
    headers: {
      accept: 'application/json',
      // @ts-ignore
      Authorization: `Bearer ${session.user.accessToken}`
    }
  })

  if (!response.ok) {
    return { error: 'Unauthorized' }
  }

  revalidatePath('/')
  return revalidatePath(path)
}

export async function clearChats() {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: 'Unauthorized' }
  }

  const response = await fetch(`http://localhost:8080/api/v1/chats`, {
    method: 'DELETE',
    headers: {
      accept: 'application/json',
      // @ts-ignore
      Authorization: `Bearer ${session.user.accessToken}`
    }
  })

  if (!response.ok) {
    return { error: 'Unauthorized' }
  }

  revalidatePath('/')
  return redirect('/')
}

export async function getSharedChat(id: string) {
  const chat = await kv.hgetall<Chat>(`chat:${id}`)

  if (!chat || !chat.sharePath) {
    return null
  }

  return chat
}

export async function shareChat(id: string) {
  const session = await auth()

  if (!session?.user?.id) {
    return {
      error: 'Unauthorized'
    }
  }

  const chat = await kv.hgetall<Chat>(`chat:${id}`)

  if (!chat || chat.userId !== session.user.id) {
    return {
      error: 'Something went wrong'
    }
  }

  const payload = {
    ...chat,
    sharePath: `/share/${chat.id}`
  }

  await kv.hmset(`chat:${chat.id}`, payload)

  return payload
}

export async function saveChat(chat: Chat) {
  const session = await auth()
  if (session && session.user) {
    const response = await fetch(`http://localhost:8080/api/v1/chats/`, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'Content-Type': 'application/json',
        // @ts-ignore
        Authorization: `Bearer ${session.user.accessToken}`
      },
      body: JSON.stringify(chat)
    })

    if (!response.ok) {
      return
    }
    const savedChat = await response.json()

    return savedChat
  }
}

export async function refreshHistory(path: string) {
  redirect(path)
}

export async function getMissingKeys() {
  const keysRequired = ['OPENAI_API_KEY']
  return keysRequired
    .map(key => (process.env[key] ? '' : key))
    .filter(key => key !== '')
}
