import type { Metadata } from "next"
import { Inter_Tight } from "next/font/google"
import "./globals.css"

const interTight = Inter_Tight({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-inter-tight",
  display: "swap",
})

export const metadata: Metadata = {
  title: "EVAN HUANG",
  description: "Evan Huang — Developer portfolio. Neo-Noir Brutalist.",
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
    <html lang="en" className={interTight.variable} suppressHydrationWarning>
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  )
}
