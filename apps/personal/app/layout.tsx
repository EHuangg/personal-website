import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Find Evan",
  description: "Evan Huang — Mathematics graduate, software developer, network engineer.",
  icons: {
    icon: "/favicon.png",
    apple: "/favicon.png",
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  )
}
