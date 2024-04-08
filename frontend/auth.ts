import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { z } from 'zod'

import type { User } from '@/lib/types'

import { authConfig } from './auth.config'

export const { auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsedCredentials = z
          .object({
            email: z.string().email(),
            password: z.string().min(6)
          })
          .safeParse(credentials)

        if (parsedCredentials.success) {
          const { email, password } = parsedCredentials.data
          const res = await fetch(
            `${process.env.BACKEND_HOST}/api/v1/login/access-token`,
            {
              method: 'POST',
              body: new URLSearchParams({
                username: email,
                password: password
              }),
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                Accept: 'application/json'
              }
            }
          )
          if (!res.ok) {
            // credentials are invalid
            return null
          }
          const response = await res.json()
          const user = response.user as User

          response.user.id = String(response.user.id)
          response.user.token = response.access_token

          if (!user) return null
          return { ...user }
        }

        return null
      }
    })
  ]
})
