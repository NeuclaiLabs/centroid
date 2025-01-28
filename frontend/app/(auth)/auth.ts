// frontend/app/(auth)/auth.ts
import NextAuth, { User, Session } from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { authConfig } from "./auth.config";

interface ExtendedSession extends Session {
  user: User & { id: string; token: string };
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
        const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/login/access-token`;

        try {
          const res = await fetch(apiUrl, {
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

          const contentType = res.headers.get("content-type");
          if (!contentType?.includes("application/json")) {
            console.error("Received non-JSON response:", await res.text());
            throw new Error("Invalid API response format");
          }

          if (!res.ok) {
            const errorData = await res.json();
            console.error("API error response:", errorData);
            throw new Error(errorData.detail || "Authentication failed");
          }

          const response = await res.json();

          if (!response.user) {
            console.error("No user data in response:", response);
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
