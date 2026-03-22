"use client"

import { useState, useEffect, useCallback } from "react"
import PixelArtDrawer from "./PixelArtDrawer"

const COOKIE = "visitor_pin_id"

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

function setCookie(name: string, value: string, days = 36500) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString()
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires};path=/;SameSite=Lax`
}

function deleteCookie(name: string) {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
}

// Round to 3 decimal places — ~100m precision, no sensitive data
function fuzzyCoord(n: number) {
  return Math.round(n * 1000) / 1000
}

type VisitorPin = { id: string; lat: number; lng: number; pixel_art: string }

export default function VisitorFooter({
  showPins, onToggle, onPinsLoaded,
}: {
  showPins: boolean
  onToggle: (v: boolean) => void
  onPinsLoaded: (pins: VisitorPin[]) => void
}) {
  const [count, setCount] = useState<number | null>(null)
  const [hasPin, setHasPin] = useState(false)
  const [existingArt, setExistingArt] = useState<string | null>(null)
  const [showDrawer, setShowDrawer] = useState(false)
  const [locating, setLocating] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [pendingCoords, setPendingCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const loadPins = useCallback(async () => {
    try {
      const res = await fetch("/api/visitor-pins")
      const data: VisitorPin[] = await res.json()
      setCount(Array.isArray(data) ? data.length : 0)
      if (Array.isArray(data)) {
        onPinsLoaded(data)
        // Find our own pin by cookie id
        const myId = getCookie(COOKIE)
        const mine = data.find((p) => p.id === myId)
        if (mine) setExistingArt(mine.pixel_art)
      }
    } catch { setCount(0) }
  }, [onPinsLoaded])

  useEffect(() => {
    loadPins()
    setHasPin(!!getCookie(COOKIE))
  }, [loadPins])

  async function handleAdd() {
    setError(null)
    // If editing, skip geolocation — reuse existing coords from the stored pin
    if (hasPin && existingArt) {
      setShowDrawer(true)
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false)
        // Fuzz to ~1km precision
        setPendingCoords({
          lat: fuzzyCoord(pos.coords.latitude),
          lng: fuzzyCoord(pos.coords.longitude),
        })
        setShowDrawer(true)
      },
      (err) => {
        setLocating(false)
        if (err.code === 1) setError("Location permission denied.")
        else setError("Couldn't get your location.")
      },
      { enableHighAccuracy: false, timeout: 8000 }
    )
  }

  async function handleSubmit(dataUrl: string) {
    setSubmitting(true)
    setShowDrawer(false)

    // If editing an existing pin — delete first, then re-add
    if (hasPin) {
      const id = getCookie(COOKIE)
      if (id) {
        await fetch("/api/visitor-pins", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        })
      }
      deleteCookie(COOKIE)
    }

    // If editing, we don't have pendingCoords — fetch existing coords from pins
    let coords = pendingCoords
    if (!coords) {
      const myId = getCookie(COOKIE)
      const res = await fetch("/api/visitor-pins")
      const pins: VisitorPin[] = await res.json()
      const mine = pins.find((p) => p.id === myId)
      if (mine) coords = { lat: mine.lat, lng: mine.lng }
    }

    if (!coords) { setError("Couldn't get location."); setSubmitting(false); return }

    try {
      const res = await fetch("/api/visitor-pins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...coords, pixel_art: dataUrl }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      setCookie(COOKIE, data.id)
      setHasPin(true)
      setExistingArt(dataUrl)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
      await loadPins()
      onToggle(true)
    } catch {
      setError("Failed to submit. Try again.")
    } finally {
      setSubmitting(false)
      setPendingCoords(null)
    }
  }

  async function handleRemove() {
    const id = getCookie(COOKIE)
    if (!id) { setHasPin(false); return }
    try {
      const res = await fetch("/api/visitor-pins", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? "Failed to remove.")
        return
      }
      deleteCookie(COOKIE)
      setHasPin(false)
      setExistingArt(null)
      await loadPins()
    } catch {
      setError("Failed to remove sticky note.")
    }
  }

  return (
    <>
      {showDrawer && (
        <PixelArtDrawer
          initialArt={existingArt ?? undefined}
          onSubmit={handleSubmit}
          onCancel={() => { setShowDrawer(false); setPendingCoords(null) }}
        />
      )}

      <div style={{
        borderTop: "0.5px solid var(--ink-faint)",
        padding: "0.75rem 1rem",
        background: "var(--sidebar-bg)",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
          <span style={{ fontSize: "0.72rem", color: "var(--ink-muted)", fontFamily: "var(--font-mono)" }}>
            {count === null ? "loading..." : `${count} ${count === 1 ? "person" : "people"} left a mark`}
          </span>
          <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
            <span style={{ fontSize: "0.68rem", color: "var(--ink-muted)", fontFamily: "var(--font-mono)" }}>show stickies</span>
            <div onClick={() => onToggle(!showPins)} style={{
              width: 36, height: 20, borderRadius: 10,
              background: showPins ? "var(--blue)" : "#c8b89a",
              position: "relative", cursor: "pointer",
              transition: "background 0.2s",
            }}>
              <div style={{
                position: "absolute", top: 2,
                left: showPins ? 18 : 2,
                width: 16, height: 16, borderRadius: "50%",
                background: "white", boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                transition: "left 0.2s",
              }} />
            </div>
          </label>
        </div>

        {error && <div style={{ fontSize: "0.68rem", color: "#ff3b30", marginBottom: "0.4rem", fontFamily: "var(--font-mono)" }}>{error}</div>}
        {success && <div style={{ fontSize: "0.68rem", color: "#30b94d", marginBottom: "0.4rem", fontFamily: "var(--font-mono)" }}>✓ sticky note added!</div>}

        {!hasPin ? (
          <button onClick={handleAdd} disabled={locating || submitting} style={{
            width: "100%", padding: "0.5rem",
            background: locating || submitting ? "#c8b89a" : "#2a2318",
            color: "#f5f0e8", border: "none", borderRadius: 8,
            fontSize: "0.75rem", fontFamily: "var(--font-mono)",
            cursor: locating || submitting ? "not-allowed" : "pointer",
            letterSpacing: "0.04em",
          }}>
            {locating ? "finding your location..." : submitting ? "saving..." : "leave your mark"}
          </button>
        ) : (
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={handleAdd} style={{
              flex: 1, padding: "0.45rem",
              background: "transparent", color: "var(--ink-muted)",
              border: "1px solid var(--ink-faint)", borderRadius: 8,
              fontSize: "0.7rem", fontFamily: "var(--font-mono)", cursor: "pointer",
            }}>✎ edit</button>
            <button onClick={handleRemove} style={{
              flex: 1, padding: "0.45rem",
              background: "transparent", color: "#ff3b30",
              border: "1px solid #ff3b30", borderRadius: 8,
              fontSize: "0.7rem", fontFamily: "var(--font-mono)", cursor: "pointer",
            }}>✕ remove</button>
          </div>
        )}
      </div>
    </>
  )
}
