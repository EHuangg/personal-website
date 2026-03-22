"use client"

import { useEffect, useState } from "react"

function useTimer(createdAt: string | null) {
  const [elapsed, setElapsed] = useState("")

  useEffect(() => {
    if (!createdAt) return
    const update = () => {
      const diff = Date.now() - new Date(createdAt).getTime()
      const d = Math.floor(diff / 86400000)
      const h = Math.floor((diff % 86400000) / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setElapsed(d > 0 ? `${d}d ${h}h ${m}m` : `${h}h ${m}m ${s}s`)
    }
    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [createdAt])

  return elapsed
}

export default function EditorHeader({
  mode,
  snapshotCreatedAt,
  isDefault,
  queueCount,
  submitting,
  displayName,
  onModeChange,
  onSubmit,
  onDisplayNameChange,
}: {
  mode: "build" | "ai"
  snapshotCreatedAt: string | null
  isDefault: boolean
  queueCount: number
  submitting: boolean
  displayName: string
  onModeChange: (mode: "build" | "ai") => void
  onSubmit: () => void
  onDisplayNameChange: (name: string) => void
}) {
  const elapsed = useTimer(snapshotCreatedAt)

  return (
    <div style={{
      height: 44,
      background: "#f5f0e8",
      borderBottom: "1px solid #c8b89a",
      display: "flex",
      alignItems: "center",
      padding: "0 1rem",
      gap: "1rem",
      fontFamily: "'IBM Plex Mono', monospace",
      fontSize: "0.72rem",
      flexShrink: 0,
      zIndex: 50,
    }}>
      {/* Back button */}
      <a href="/" style={{ color: "#9a8a72", textDecoration: "none", letterSpacing: "0.06em", fontSize: "0.72rem", flexShrink: 0 }}>
        ← back
      </a>
        <a href="https://www.evan-huang.dev/" target="_blank" rel="noopener noreferrer"
          style={{ color: "#9a8a72", textDecoration: "none", letterSpacing: "0.06em", flexShrink: 0 }}>
          evan&apos;s original page ↗
        </a>
      

      {/* Timer */}
      <div style={{ color: "#9a8a72", letterSpacing: "0.06em", flexShrink: 0 }}>
        {isDefault ? "default page" : elapsed ? `⏱ ${elapsed}` : ""}
      </div>

      {/* Queue count */}
      {queueCount > 0 && (
        <div style={{ color: "#9a8a72", letterSpacing: "0.06em", flexShrink: 0 }}>
          {queueCount} queued
        </div>
      )}

      <div style={{ flex: 1 }} />

      {/* Mode toggle */}
      <div style={{
        display: "flex",
        background: "#e8e0d0",
        borderRadius: 20,
        padding: 2,
        gap: 2,
        flexShrink: 0,
      }}>
        {(["build", "ai"] as const).map((m) => (
          <button
            key={m}
            onClick={() => onModeChange(m)}
            style={{
              padding: "3px 12px",
              borderRadius: 16,
              border: "none",
              background: mode === m ? "#2a2318" : "transparent",
              color: mode === m ? "#f5f0e8" : "#9a8a72",
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: "0.68rem",
              letterSpacing: "0.08em",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            {m === "build" ? "BUILD" : "AI"}
          </button>
        ))}
      </div>

      {/* Name input */}
      <input
        value={displayName}
        onChange={(e) => onDisplayNameChange(e.target.value)}
        placeholder="your name (optional)"
        maxLength={30}
        style={{
          background: "transparent",
          border: "1px solid #c8b89a",
          borderRadius: 4,
          padding: "3px 8px",
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: "0.68rem",
          color: "#6a5a42",
          width: 160,
          outline: "none",
        }}
      />

      {/* Submit button */}
      <button
        onClick={onSubmit}
        disabled={submitting}
        style={{
          background: "#2a2318",
          color: "#f5f0e8",
          border: "none",
          borderRadius: 4,
          padding: "4px 14px",
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: "0.72rem",
          letterSpacing: "0.06em",
          cursor: submitting ? "not-allowed" : "pointer",
          opacity: submitting ? 0.5 : 1,
          flexShrink: 0,
        }}
      >
        {submitting ? "submitting..." : "submit →"}
      </button>
    </div>
  )
}
