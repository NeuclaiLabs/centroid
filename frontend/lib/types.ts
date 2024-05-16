import { CoreMessage } from 'ai'
export type Message = CoreMessage & {
  id: string
}
export interface Chat extends Record<string, any> {
  id: string
  title: string
  createdAt: Date
  userId: string
  path: string
  messages: Message[]
  sharePath?: string
}
export interface Connection extends Record<string, any> {
  id: string
  name: string
  type: string
  data: { url?: string; key?: string }
  createdAt?: Date
  updatedAt?: Date
  ownerId: string
}

export type ServerActionResult<Result> = Promise<
  | Result
  | {
      error: string
    }
>

export interface Session {
  user: {
    id: string
    email: string
  }
}

export interface AuthResult {
  type: string
  message: string
}

export interface User extends Record<string, any> {
  id: string
  email: string
  password: string
  salt: string
}

export interface Model {
  id: string
  name?: string
  connection: Connection
}
