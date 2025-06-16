import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  pages: {
    signIn: '/login',
    newUser: '/',
  },
  providers: [
    // added later in auth.ts since it requires bcrypt which is only compatible with Node.js
    // while this file is also used in non-Node.js environments
  ],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const pathname = nextUrl.pathname;

      // Check if the route is protected (core) or (chat)
      const isProtectedRoute =
        pathname.startsWith('/agents') ||
        pathname.startsWith('/mcp') ||
        pathname.startsWith('/logs') ||
        pathname.startsWith('/chat');

      // If it's a protected route and user is not logged in, redirect to login
      if (isProtectedRoute && !isLoggedIn) {
        return false; // This will redirect to the signIn page
      }

      // If user is logged in and trying to access auth pages, redirect to home
      if (
        isLoggedIn &&
        (pathname.startsWith('/login') || pathname.startsWith('/register'))
      ) {
        return Response.redirect(new URL('/', nextUrl));
      }

      return true;
    },
  },
} satisfies NextAuthConfig;
