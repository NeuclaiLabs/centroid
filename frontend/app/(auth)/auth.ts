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
      credentials: {},
      async authorize({ email, password }: any) {
        // let users = await getUser(email);
        // if (users.length === 0) return null;
        // let passwordsMatch = await compare(password, users[0].password!);
        // if (passwordsMatch) return users[0] as any;
        const res = await fetch(`${process.env.BACKEND_HOST}/api/v1/login/access-token`, {
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
          // credentials are invalid
          return null;
        }
        const response = await res.json();
        const user = response.user as User;

        response.user.id = String(response.user.id);
        response.user.token = response.access_token;

        if (!user) return null;
        return { ...user };
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
