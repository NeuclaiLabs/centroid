import NextAuth, { User, Session } from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { authConfig } from "./auth.config";

interface ExtendedSession extends Session {
  user: User;
}

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize({ email, password }: any) {
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/login/access-token`, {
            method: "POST",
            body: new URLSearchParams({
              username: email,
              password: password,
            }),
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
              Accept: "application/json",
            },
          });

          if (!res.ok) {
            throw new Error("Authentication failed");
          }

          const response = await res.json();

          if (!response.user) {
            return null;
          }

          return {
            id: String(response.user.id),
            email: response.user.email,
            name: response.user.name,
            token: response.access_token,
          };
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // @ts-ignore
        token = { ...token, accessToken: (user as User).token, id: user.id };
      }

      return token;
    },
    async session({ session, token }) {
      if (token) {
        const { id, accessToken } = token as { id: string; accessToken: string };
        const { user } = session;
        // @ts-ignore
        session = { ...session, user: { ...user, id, accessToken } };
      }

      return session;
    },
  },
});
