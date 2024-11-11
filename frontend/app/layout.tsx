import { Metadata } from "next";
import Script from "next/script";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";

import { ThemeProvider } from "@/components/custom/theme-provider";

import "./globals.css";

export const viewport = {
  maximumScale: 1, // Disable auto-zoom on mobile Safari
};

export const metadata: Metadata = {
  metadataBase: new URL("https://chat.vercel.ai"),
  title: "Next.js Chatbot Template",
  description: "Next.js chatbot template using the AI SDK.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      // `next-themes` injects an extra classname to the body element to avoid
      // visual flicker before hydration. Hence the `suppressHydrationWarning`
      // prop is necessary to avoid the React hydration mismatch warning.
      suppressHydrationWarning
    >
      <head>
        <Script id="microsoft-clarity" strategy="afterInteractive">
          {`
            (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "oo74o2rkwa");
          `}
        </Script>
      </head>
      <body className="antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <SessionProvider>
              <Toaster position="top-center" />
              {children}
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
