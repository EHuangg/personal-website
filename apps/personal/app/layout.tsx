import type { Metadata } from "next"
import "./globals.css"
import { siteConfig } from "@personal-website/shared"

export const metadata: Metadata = {
  title: siteConfig.name,
  description: siteConfig.bio,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
