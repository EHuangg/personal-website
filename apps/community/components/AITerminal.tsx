"use client"

import { useState, useRef, useEffect } from "react"

export default function AITerminal({
  onSubmit,
  onClose,
}: {
  onSubmit: (prompt: string) => Promise<void>
  onClose: () => void
}) {
  const [input, setInput] = useState("")
  const [lines, setLines] = useState<string[]>([
    "// AI REWRITE TERMINAL",
    "// describe how you want the site to look",
    "// press enter to submit, esc to close",
    "",
  ])
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  async function handleSubmit() {
    if (!input.trim() || loading) return
    const prompt = input.trim()
    setInput("")
    setLines((l) => [...l, `> ${prompt}`, ""])
    setLoading(true)
    setLines((l) => [...l, "submitting to queue..."])
    try {
      await onSubmit(prompt)
      setLines((l) => [...l, "✓ queued. the site will update at the next build.", ""])
    } catch {
      setLines((l) => [...l, "✗ error submitting. try again.", ""])
    }
    setLoading(false)
  }

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(0,0,0,0.85)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        width: "min(640px, 90vw)",
        background: "#0d0d0d",
        border: "1px solid #2a2820",
        borderRadius: 8,
        fontFamily: "'IBM Plex Mono', monospace",
        overflow: "hidden",
      }}>
        {/* Terminal titlebar */}
        <div style={{ background: "#1a1a1a", padding: "8px 12px", display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#ff5f57", cursor: "pointer" }} onClick={onClose} />
          <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#febc2e" }} />
          <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#28c840" }} />
          <span style={{ fontSize: "0.7rem", color: "#5a5a5a", marginLeft: "auto" }}>ai rewrite — evan-huang.dev</span>
        </div>

        {/* Output */}
        <div style={{ padding: "1rem", minHeight: 180, maxHeight: 300, overflowY: "auto", fontSize: "0.8rem", lineHeight: 1.8, color: "#7a9a72" }}>
          {lines.map((line, i) => (
            <div key={i} style={{ color: line.startsWith(">") ? "#f5f0e8" : line.startsWith("✓") ? "#4a9a4a" : line.startsWith("✗") ? "#9a4a4a" : "#7a9a72" }}>
              {line || " "}
            </div>
          ))}
        </div>

        {/* Input */}
        <div style={{ borderTop: "1px solid #2a2820", padding: "0.75rem 1rem", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: "#4a9a4a", fontSize: "0.85rem" }}>{">"}</span>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSubmit()
              if (e.key === "Escape") onClose()
            }}
            disabled={loading}
            placeholder="make it dark mode / redesign as a newspaper..."
            style={{
              flex: 1, background: "transparent", border: "none", outline: "none",
              color: "#f5f0e8", fontSize: "0.82rem", fontFamily: "inherit",
            }}
          />
          {loading && <span style={{ color: "#7a9a72", fontSize: "0.75rem" }}>sending...</span>}
        </div>
      </div>
    </div>
  )
}
