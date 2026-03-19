import type { Metadata } from "next"
import "./globals.css"
import { siteConfig } from "@personal-website/shared"

export const metadata: Metadata = {
  title: `${siteConfig.name} — community edition`,
  description: "Too lazy to update my own website. You do it.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
