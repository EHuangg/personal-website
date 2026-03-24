import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Evan Maps",
  description: "Evan Huang — Mathematics graduate, software developer, network engineer.",
  icons: {
    icon: [
      { url: "/favicon.png?v=2", type: "image/png" },
      { url: "/favicon.ico?v=2", rel: "shortcut icon" },
    ],
    apple: "/favicon.png?v=2",
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  )
}
