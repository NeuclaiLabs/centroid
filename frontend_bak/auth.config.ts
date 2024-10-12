import type { NextAuthConfig } from 'next-auth'

import type { User } from '@/lib/types'

export const authConfig = {
  trustHost: true,
  secret: process.env.SECRET_KEY,
  session: {
    strategy: 'jwt'
  },
  pages: {
    signIn: '/login',
    newUser: '/signup'
  },
  callbacks: {
    async authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isOnLoginPage = nextUrl.pathname.startsWith('/login')
      const isOnSignupPage = nextUrl.pathname.startsWith('/signup')

      if (isLoggedIn) {
        if (isOnLoginPage || isOnSignupPage) {
          return Response.redirect(new URL('/', nextUrl), 307)
        }
      }

      return true
    },
    async jwt({ token, user }) {
      if (user) {
        token = { ...token, accessToken: (user as User).token, id: user.id }
      }

      return token
    },
    async session({ session, token }) {
      if (token) {
        const { id, accessToken } = token as { id: string; accessToken: string }
        const { user } = session
        // @ts-ignore
        session = { ...session, user: { ...user, id, accessToken } }
      }

      return session
    }
  },
  providers: []
} satisfies NextAuthConfig
