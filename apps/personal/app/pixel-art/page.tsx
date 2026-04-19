"use client"

import { useCallback, useEffect, useState } from "react"
import gsap from "gsap"
import PageShell from "../components/PageShell"
import PixelArtDrawer from "../components/PixelArtDrawer"

// ─── Types ───────────────────────────────────────────────────────────────────

type VisitorPin = {
  id: string
  lat: number
  lng: number
  pixel_art: string
  created_at?: string
}

// ─── Cookie/Storage helpers ──────────────────────────────────────────────────

const PIN_COOKIE     = "visitor_pin_id"
const DEVICE_COOKIE  = "visitor_device_id"
const LAST_COORDS_KEY = "visitor_last_coords"

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

function getOrCreateDeviceId(): string {
  const fromCookie = getCookie(DEVICE_COOKIE)
  if (fromCookie) return fromCookie
  let id = ""
  try { id = localStorage.getItem(DEVICE_COOKIE) ?? "" } catch { /* empty */ }
  if (!id) {
    id = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`
  }
  try { localStorage.setItem(DEVICE_COOKIE, id) } catch { /* empty */ }
  setCookie(DEVICE_COOKIE, id)
  return id
}

function saveLastCoords(coords: { lat: number; lng: number }) {
  try { localStorage.setItem(LAST_COORDS_KEY, JSON.stringify(coords)) } catch { /* empty */ }
}

function getLastCoords(): { lat: number; lng: number } | null {
  try {
    const raw = localStorage.getItem(LAST_COORDS_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (typeof parsed?.lat === "number" && typeof parsed?.lng === "number") return parsed
  } catch { /* empty */ }
  return null
}

function addRandomDisplacement(lat: number, lng: number) {
  const minKm = 0.5, maxKm = 1
  const angle = Math.random() * Math.PI * 2
  const dist  = minKm + Math.random() * (maxKm - minKm)
  const dLat  = (dist * Math.cos(angle)) / 111
  const dLng  = (dist * Math.sin(angle)) / (111 * Math.max(0.2, Math.cos((lat * Math.PI) / 180)))
  return { lat: lat + dLat, lng: lng + dLng }
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function PixelArtPage() {
  const [pins,        setPins]        = useState<VisitorPin[]>([])
  const [myPin,       setMyPin]       = useState<VisitorPin | null>(null)
  const [existingArt, setExistingArt] = useState<string | null>(null)
  const [submitting,  setSubmitting]  = useState(false)
  const [pinError,    setPinError]    = useState<string | null>(null)
  const [pinSuccess,  setPinSuccess]  = useState(false)
  const [otherIndex,  setOtherIndex]  = useState(0)

  const hasPin = !!myPin
  const otherPins = pins.filter((p) => p.id !== myPin?.id)
  const safeIdx = otherPins.length === 0 ? 0 : Math.min(otherIndex, otherPins.length - 1)
  const activePin = otherPins[safeIdx] ?? null
  const editorKey = `${myPin?.id ?? "new"}-${existingArt ?? "blank"}`

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".noir-section-title",
        { opacity: 0, x: -80, rotation: -2 },
        { opacity: 1, x: 0, rotation: 0, duration: 0.8, ease: "power4.out" }
      )
    })
    return () => ctx.revert()
  }, [])

  // ── Pin loading ────────────────────────────────────────────────────────────
  const loadPins = useCallback(async () => {
    try {
      const deviceId = getOrCreateDeviceId()
      const [allRes, mineRes] = await Promise.all([
        fetch("/api/visitor-pins"),
        fetch(`/api/visitor-pins?device_id=${encodeURIComponent(deviceId)}`),
      ])
      const allData  = await allRes.json()
      const mineData = await mineRes.json()
      const all  = Array.isArray(allData)  ? allData      : []
      const mine = Array.isArray(mineData) ? (mineData[0] ?? null) : null
      setPins(all)
      setMyPin(mine)
      if (mine?.id) { setCookie(PIN_COOKIE, mine.id); setExistingArt(mine.pixel_art) }
      else          { deleteCookie(PIN_COOKIE);        setExistingArt(null) }
    } catch { setPins([]) }
  }, [])

  useEffect(() => { loadPins() }, [loadPins])

  useEffect(() => {
    if (!pinSuccess) return
    const t = window.setTimeout(() => setPinSuccess(false), 3000)
    return () => window.clearTimeout(t)
  }, [pinSuccess])

  // ── Coords resolution ─────────────────────────────────────────────────────
  const resolveSaveCoords = useCallback(async (): Promise<{ lat: number; lng: number } | null> => {
    if (myPin) return { lat: myPin.lat, lng: myPin.lng }
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = addRandomDisplacement(pos.coords.latitude, pos.coords.longitude)
          saveLastCoords(coords)
          resolve(coords)
        },
        (err) => {
          if (err.code === 1) {
            const last = getLastCoords()
            if (last) { setPinError("Using last saved location."); resolve(last); return }
            setPinError("Location is required for a first-time pin.")
            resolve(null)
            return
          }
          setPinError("Could not get your location.")
          resolve(null)
        },
        { enableHighAccuracy: false, timeout: 8000 },
      )
    })
  }, [myPin])

  // ── Save / delete pin ─────────────────────────────────────────────────────
  const handleSavePin = useCallback(async (dataUrl: string) => {
    setPinError(null)
    setSubmitting(true)
    try {
      const coords = await resolveSaveCoords()
      if (!coords) return
      const deviceId = getOrCreateDeviceId()
      if (myPin) {
        const delRes = await fetch("/api/visitor-pins", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: myPin.id, device_id: deviceId }),
        })
        if (!delRes.ok) {
          const d = await delRes.json().catch(() => ({}))
          setPinError(d.error ?? "Failed to update."); return
        }
      }
      const postRes = await fetch("/api/visitor-pins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...coords, pixel_art: dataUrl, device_id: deviceId }),
      })
      const postData = await postRes.json()
      if (!postRes.ok) { setPinError(postData.error ?? "Failed to submit."); return }
      if (postData?.id) setCookie(PIN_COOKIE, postData.id)
      setPinSuccess(true)
      setPinError(null)
      await loadPins()
    } catch { setPinError("Failed to submit your pixel art.") }
    finally  { setSubmitting(false) }
  }, [loadPins, myPin, resolveSaveCoords])

  const handleDeletePin = useCallback(async () => {
    if (!myPin) return
    setPinError(null)
    setSubmitting(true)
    try {
      const deviceId = getOrCreateDeviceId()
      const res = await fetch("/api/visitor-pins", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: myPin.id, device_id: deviceId }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { setPinError(data.error ?? "Failed to delete."); return }
      deleteCookie(PIN_COOKIE)
      setMyPin(null)
      setExistingArt(null)
      await loadPins()
    } catch { setPinError("Failed to delete your pixel art.") }
    finally  { setSubmitting(false) }
  }, [loadPins, myPin])

  return (
    <PageShell>
      <div className="noir-section-title">
        <span className="title-outline">PIXEL</span>
        <span className="title-red">ART</span>
      </div>

      <div className="noir-container">
        <div className="pixel-page-grid">
          {/* Editor */}
          <div className="pixel-editor-pane">
            <PixelArtDrawer
              key={editorKey}
              initialArt={existingArt ?? undefined}
              onSubmit={handleSavePin}
              onCancel={() => setPinError(null)}
              submitting={submitting}
              onDelete={hasPin ? handleDeletePin : undefined}
              statusMessage={pinError ?? (pinSuccess ? "Saved." : null)}
              statusTone={pinError ? "error" : pinSuccess ? "success" : "neutral"}
            />
          </div>

          {/* Gallery */}
          <div className="pixel-gallery-pane">
            <p className="pixel-gallery-label">
              VISITOR GALLERY · {otherPins.length} {otherPins.length === 1 ? "DRAWING" : "DRAWINGS"}
            </p>

            {activePin ? (
              <div className="carousel-preview">
                <img
                  src={activePin.pixel_art}
                  alt={`Visitor pixel art ${safeIdx + 1}`}
                  className="carousel-img"
                />
                {otherPins.length > 1 && (
                  <div className="carousel-controls">
                    <button
                      className="carousel-arrow"
                      onClick={() => setOtherIndex((i) => (i - 1 + otherPins.length) % otherPins.length)}
                      aria-label="Previous"
                    >‹</button>
                    <span className="carousel-count">{safeIdx + 1} / {otherPins.length}</span>
                    <button
                      className="carousel-arrow"
                      onClick={() => setOtherIndex((i) => (i + 1) % otherPins.length)}
                      aria-label="Next"
                    >›</button>
                  </div>
                )}
              </div>
            ) : (
              <p className="carousel-empty">NO VISITOR ART YET.<br />BE THE FIRST.</p>
            )}
          </div>
        </div>
      </div>

      <div style={{ height: "clamp(40px, 5vw, 80px)" }} />
    </PageShell>
  )
}
