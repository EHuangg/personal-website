"use client"

import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"

const TORONTO_LNG = -79.3832
const TORONTO_LAT = 43.6532

type MapboxMap = {
  getCenter: () => { lng: number; lat: number }
  getZoom: () => number
  getBearing: () => number
  getPitch: () => number
  jumpTo: (opts: object) => void
  on: (event: string, cb: () => void) => void
  remove: () => void
}

const PAPER_STYLE = {
  version: 8,
  glyphs: "mapbox://fonts/mapbox/{fontstack}/{range}",
  sources: {
    "mapbox-streets": {
      type: "vector",
      url: "mapbox://mapbox.mapbox-streets-v8",
    },
  },
  layers: [
    { id: "background", type: "background", paint: { "background-color": "#f5f0e8" } },
    { id: "water", type: "fill", source: "mapbox-streets", "source-layer": "water", paint: { "fill-color": "#d8cebb" } },
    { id: "parks", type: "fill", source: "mapbox-streets", "source-layer": "landuse", filter: ["==", "class", "park"], paint: { "fill-color": "#ede8de" } },
    { id: "roads-minor", type: "line", source: "mapbox-streets", "source-layer": "road", filter: ["in", "class", "street", "street_limited", "service"], paint: { "line-color": "#c8b89a", "line-width": 0.6 } },
    { id: "roads-major", type: "line", source: "mapbox-streets", "source-layer": "road", filter: ["in", "class", "primary", "secondary", "tertiary"], paint: { "line-color": "#b8a88a", "line-width": 1.2 } },
    { id: "roads-highway", type: "line", source: "mapbox-streets", "source-layer": "road", filter: ["in", "class", "motorway", "trunk"], paint: { "line-color": "#9a8a72", "line-width": 2 } },
    { id: "building", type: "fill", source: "mapbox-streets", "source-layer": "building", paint: { "fill-color": "#ede8de", "fill-outline-color": "#c8b89a" } },
    { id: "road-labels", type: "symbol", source: "mapbox-streets", "source-layer": "road", layout: { "text-field": ["get", "name"], "text-font": ["DIN Pro Regular", "Arial Unicode MS Regular"], "text-size": 9, "symbol-placement": "line" }, paint: { "text-color": "#9a8a72", "text-halo-color": "#f5f0e8", "text-halo-width": 1 } },
  ],
}

export default function MapBackground({ children }: { children: React.ReactNode }) {
  const bgRef = useRef<HTMLDivElement>(null)
  const cutoutRef = useRef<HTMLDivElement>(null)
  const bgMap = useRef<MapboxMap | null>(null)
  const cutoutMap = useRef<MapboxMap | null>(null)
  const syncing = useRef(false)
  const [time, setTime] = useState("")
  const [cutoutEl, setCutoutEl] = useState<HTMLElement | null>(null)

  // Live clock
  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString("en-CA", {
      timeZone: "America/Toronto", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
    }))
    tick()
    const t = setInterval(tick, 1000)
    return () => clearInterval(t)
  }, [])

  // Find cutout placeholder in DOM for portal
  useEffect(() => {
    const el = document.getElementById("map-cutout-placeholder")
    if (el) setCutoutEl(el)
  }, [])

  // Init maps
  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
    if (!token || !bgRef.current || !cutoutRef.current) {
      console.warn("[MapBackground] Missing token or refs", { token: !!token, bg: !!bgRef.current, cut: !!cutoutRef.current })
      return
    }
    console.log("[MapBackground] Initializing maps with token:", token.slice(0, 10) + "...")
    let cancelled = false

    import("mapbox-gl").then(({ default: mapboxgl }) => {
      if (cancelled) return
      
      mapboxgl.accessToken = token

      const bg = new mapboxgl.Map({
        container: bgRef.current!,
        style: PAPER_STYLE as unknown as mapboxgl.Style,
        center: [TORONTO_LNG, TORONTO_LAT],
        zoom: 13,
        attributionControl: false,
      }) as unknown as MapboxMap

      const cut = new mapboxgl.Map({
        container: cutoutRef.current!,
        style: PAPER_STYLE as unknown as mapboxgl.Style,
        center: [TORONTO_LNG, TORONTO_LAT],
        zoom: 13,
        interactive: false,
        attributionControl: false,
      }) as unknown as MapboxMap

      bg.on("move", () => {
        if (syncing.current) return
        syncing.current = true
        cut.jumpTo({ center: bg.getCenter(), zoom: bg.getZoom(), bearing: bg.getBearing(), pitch: bg.getPitch() })
        syncing.current = false
      })

      bgMap.current = bg
      cutoutMap.current = cut
    })

    return () => {
      cancelled = true
      bgMap.current?.remove()
      cutoutMap.current?.remove()
      bgMap.current = null
      cutoutMap.current = null
    }
  }, [])

  return (
    <>
      {/* Full-page blurred background map */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0 }}>
        <div ref={bgRef} style={{ width: "100%", height: "100%" }} />
        {/* Vignette blur overlay */}
        <div style={{
          position: "absolute", inset: 0,
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          maskImage: "radial-gradient(ellipse 65% 65% at 50% 50%, black 0%, transparent 60%, black 80%)",
          WebkitMaskImage: "radial-gradient(ellipse 65% 65% at 50% 50%, black 0%, transparent 60%, black 80%)",
          pointerEvents: "none",
        }} />
        {/* Paper tint */}
        <div style={{ position: "absolute", inset: 0, background: "rgba(245,240,232,0.5)", pointerEvents: "none" }} />
      </div>

      {/* Page content */}
      <div style={{ position: "relative", zIndex: 1 }}>
        {children}
      </div>

      {/* Sharp cutout map — portalled directly into the placeholder div */}
      {cutoutEl && createPortal(
        <div style={{ position: "relative", width: "100%", height: "100%" }}>
          <div ref={cutoutRef} style={{ width: "100%", height: "100%" }} />

          {/* Pin */}
          <div style={{
            position: "absolute", top: "50%", left: "50%",
            transform: "translate(-50%, -100%)",
            display: "flex", flexDirection: "column", alignItems: "center",
            pointerEvents: "none", zIndex: 10,
          }}>
            <div style={{
              background: "#2a2318", color: "#f5f0e8",
              fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.6rem",
              padding: "2px 7px", borderRadius: 2, whiteSpace: "nowrap",
              letterSpacing: "0.08em", marginBottom: 3,
            }}>
              Toronto, ON
            </div>
            <div style={{ width: 8, height: 8, background: "#2a2318", borderRadius: "50%", border: "2px solid #f5f0e8", boxShadow: "0 0 0 1px #2a2318" }} />
            <div style={{ width: 1, height: 10, background: "#2a2318" }} />
          </div>

          {/* Clock */}
          <div style={{
            position: "absolute", bottom: 8, right: 8, zIndex: 10,
            fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.65rem",
            color: "#2a2318", background: "rgba(245,240,232,0.88)",
            padding: "2px 7px", letterSpacing: "0.08em",
            borderRadius: 2, border: "1px solid #c8b89a",
            pointerEvents: "none",
          }}>
            {time}
          </div>
        </div>,
        cutoutEl
      )}
    </>
  )
}
