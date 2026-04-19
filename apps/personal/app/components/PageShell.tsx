"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const NAV_ITEMS = [
  { label: "Skills", href: "/about" },
  { label: "Projects", href: "/projects" },
  { label: "Experience", href: "/experience" },
  { label: "Map", href: "/map" },
  { label: "Pixel Art", href: "/pixel-art" },
]

export default function PageShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="noir-page">
      <header className="noir-page-header">
        <Link href="/" className="noir-back">
          ← EVAN HUANG
        </Link>
        <nav className="noir-nav-links">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`noir-nav-link${pathname === item.href ? " noir-nav-link--active" : ""}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <div className="noir-page-content">
        {children}
      </div>
      <footer className="noir-footer">
        <span className="noir-footer-text">© 2025 Evan Huang</span>
        <span className="noir-footer-text">Toronto, CA</span>
      </footer>
    </div>
  )
}
