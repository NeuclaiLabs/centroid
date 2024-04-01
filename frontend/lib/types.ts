import { Message } from "ai"

export interface Chat extends Record<string, any> {
  id: string
  title: string
  createdAt: Date
  userId?: string
  path?: string
  messages: Message[]
  sharePath?: string
}
export interface User extends Record<string, any> {
  id: string
  email: string
  password: string
  salt: string
  jwt: string
}

export interface Session {
  user: {
    id: string
    email: string
  }
}
