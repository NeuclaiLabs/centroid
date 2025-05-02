import type React from "react"
import "@/app/global.css"
import { Inter } from "next/font/google"
import { ThemeProvider } from "next-themes"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Centroid - Self-Hostable Open Source Deployment Platform",
  description:
    "Centroid is a powerful, self-hostable platform that makes deploying and managing your applications simple, secure, and scalable.",
  openGraph: {
    title: "Centroid - Self-Hostable Open Source Deployment Platform",
    description: "Centroid is a powerful, self-hostable platform that makes deploying and managing your applications simple, secure, and scalable.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Centroid - Self-Hostable Open Source Deployment Platform",
    description: "Centroid is a powerful, self-hostable platform that makes deploying and managing your applications simple, secure, and scalable.",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
