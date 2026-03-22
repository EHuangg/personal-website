"use client"

import { useEffect, useRef, useState, useCallback } from "react"

const TORONTO_LNG = -79.3832
const TORONTO_LAT = 43.6532
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? ""

// Custom minimal style matching the site's paper aesthetic
const MAP_STYLE = {
  version: 8,
  glyphs: "mapbox://fonts/mapbox/{fontstack}/{range}",
  sources: {
    osm: {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
    },
  },
  layers: [{ id: "osm", type: "raster", source: "osm", paint: { "raster-opacity": 0 } }],
}

type MapPosition = { lng: number; lat: number; zoom: number }

export default function MapBackground({
  children,
  cutoutClassName,
}: {
  children: React.ReactNode
  cutoutClassName?: string
}) {
  const bgMapRef = useRef<HTMLDivElement>(null)
  const cutoutMapRef = useRef<HTMLDivElement>(null)
  const bgMapInstance = useRef<unknown>(null)
  const cutoutMapInstance = useRef<unknown>(null)
  const isSyncing = useRef(false)
  const [time, setTime] = useState("")
  const [mapLoaded, setMapLoaded] = useState(false)

  // Live Toronto time
  useEffect(() => {
    const update = () => {
      setTime(new Date().toLocaleTimeString("en-CA", {
        timeZone: "America/Toronto",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }))
    }
    update()
    const t = setInterval(update, 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (!MAPBOX_TOKEN) return

    let cancelled = false

    import("mapbox-gl").then((mapboxgl) => {
      if (cancelled) return
      const mapboxGl = mapboxgl.default
      mapboxGl.accessToken = MAPBOX_TOKEN

      const PAPER_STYLE: mapboxgl.Style = {
        version: 8,
        glyphs: "mapbox://fonts/mapbox/{fontstack}/{range}",
        sources: {
          "mapbox-streets": {
            type: "vector",
            url: "mapbox://mapbox.mapbox-streets-v8",
          },
        },
        layers: [
          {
            id: "background",
            type: "background",
            paint: { "background-color": "#f5f0e8" },
          },
          {
            id: "water",
            type: "fill",
            source: "mapbox-streets",
            "source-layer": "water",
            paint: { "fill-color": "#d8cebb" },
          },
          {
            id: "parks",
            type: "fill",
            source: "mapbox-streets",
            "source-layer": "landuse",
            filter: ["==", "class", "park"],
            paint: { "fill-color": "#ede8de" },
          },
          {
            id: "roads-minor",
            type: "line",
            source: "mapbox-streets",
            "source-layer": "road",
            filter: ["in", "class", "street", "street_limited", "service", "path"],
            paint: { "line-color": "#c8b89a", "line-width": 0.6 },
          },
          {
            id: "roads-major",
            type: "line",
            source: "mapbox-streets",
            "source-layer": "road",
            filter: ["in", "class", "primary", "secondary", "tertiary", "trunk"],
            paint: { "line-color": "#b8a88a", "line-width": 1.2 },
          },
          {
            id: "roads-highway",
            type: "line",
            source: "mapbox-streets",
            "source-layer": "road",
            filter: ["in", "class", "motorway", "motorway_link", "trunk"],
            paint: { "line-color": "#9a8a72", "line-width": 2 },
          },
          {
            id: "building",
            type: "fill",
            source: "mapbox-streets",
            "source-layer": "building",
            paint: { "fill-color": "#ede8de", "fill-outline-color": "#c8b89a" },
          },
          {
            id: "road-labels",
            type: "symbol",
            source: "mapbox-streets",
            "source-layer": "road",
            layout: {
              "text-field": ["get", "name"],
              "text-font": ["DIN Pro Regular", "Arial Unicode MS Regular"],
              "text-size": 9,
              "symbol-placement": "line",
            },
            paint: { "text-color": "#9a8a72", "text-halo-color": "#f5f0e8", "text-halo-width": 1 },
          },
        ],
      }

      // Background (blurred) map
      if (bgMapRef.current && !bgMapInstance.current) {
        const bgMap = new mapboxGl.Map({
          container: bgMapRef.current,
          style: PAPER_STYLE as mapboxgl.Style,
          center: [TORONTO_LNG, TORONTO_LAT],
          zoom: 13,
          attributionControl: false,
          logoPosition: "bottom-right",
        })

        bgMap.on("load", () => {
          if (!cancelled) setMapLoaded(true)
        })

        bgMap.on("move", () => {
          if (isSyncing.current) return
          isSyncing.current = true
          const c = bgMap.getCenter()
          const z = bgMap.getZoom()
          const b = bgMap.getBearing()
          const p = bgMap.getPitch()
          ;(cutoutMapInstance.current as mapboxgl.Map | null)?.jumpTo({ center: c, zoom: z, bearing: b, pitch: p })
          isSyncing.current = false
        })

        bgMapInstance.current = bgMap
      }

      // Cutout (sharp) map
      if (cutoutMapRef.current && !cutoutMapInstance.current) {
        const cutoutMap = new mapboxGl.Map({
          container: cutoutMapRef.current,
          style: PAPER_STYLE as mapboxgl.Style,
          center: [TORONTO_LNG, TORONTO_LAT],
          zoom: 13,
          interactive: false,
          attributionControl: false,
        })
        cutoutMapInstance.current = cutoutMap
      }
    })

    return () => {
      cancelled = true
      ;(bgMapInstance.current as { remove?: () => void } | null)?.remove?.()
      ;(cutoutMapInstance.current as { remove?: () => void } | null)?.remove?.()
      bgMapInstance.current = null
      cutoutMapInstance.current = null
    }
  }, [])

  return (
    <>
      {/* Full-page blurred map */}
      <div style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: mapLoaded ? "auto" : "none",
      }}>
        <div ref={bgMapRef} style={{ width: "100%", height: "100%" }} />
        {/* Edge blur vignette */}
        <div style={{
          position: "absolute",
          inset: 0,
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
          maskImage: "radial-gradient(ellipse 70% 70% at 50% 50%, transparent 30%, black 75%)",
          WebkitMaskImage: "radial-gradient(ellipse 70% 70% at 50% 50%, transparent 30%, black 75%)",
          pointerEvents: "none",
        }} />
        {/* Extra paper overlay to soften */}
        <div style={{
          position: "absolute",
          inset: 0,
          background: "rgba(245, 240, 232, 0.45)",
          pointerEvents: "none",
        }} />
      </div>

      {/* Page content */}
      <div style={{ position: "relative", zIndex: 1 }}>
        {children}
      </div>

      {/* Cutout map portal — rendered at fixed position, clipped to the cutout div */}
      <CutoutPortal mapRef={cutoutMapRef} time={time} />
    </>
  )
}

function CutoutPortal({
  mapRef,
  time,
}: {
  mapRef: React.RefObject<HTMLDivElement | null>
  time: string
}) {
  const holderRef = useRef<HTMLDivElement>(null)
  const [rect, setRect] = useState<DOMRect | null>(null)

  // Find the cutout placeholder and position over it
  useEffect(() => {
    const update = () => {
      const el = document.getElementById("map-cutout-placeholder")
      if (el) setRect(el.getBoundingClientRect())
    }
    update()
    window.addEventListener("resize", update)
    window.addEventListener("scroll", update)
    return () => {
      window.removeEventListener("resize", update)
      window.removeEventListener("scroll", update)
    }
  }, [])

  if (!rect) return null

  return (
    <div
      ref={holderRef}
      style={{
        position: "fixed",
        left: rect.left + window.scrollX,
        top: rect.top + window.scrollY,
        width: rect.width,
        height: rect.height,
        zIndex: 2,
        borderRadius: 4,
        overflow: "hidden",
        border: "1px solid #c8b89a",
        pointerEvents: "none",
      }}
    >
      {/* Sharp map */}
      <div ref={mapRef} style={{ width: "100%", height: "100%" }} />

      {/* Toronto pin */}
      <div style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        pointerEvents: "none",
      }}>
        <div style={{
          background: "#2a2318",
          color: "#f5f0e8",
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: "0.6rem",
          padding: "2px 6px",
          borderRadius: 2,
          whiteSpace: "nowrap",
          letterSpacing: "0.08em",
          marginBottom: 2,
        }}>
          Toronto, ON
        </div>
        <div style={{ width: 8, height: 8, background: "#2a2318", borderRadius: "50%", border: "2px solid #f5f0e8" }} />
        <div style={{ width: 1, height: 12, background: "#2a2318" }} />
      </div>

      {/* Time */}
      <div style={{
        position: "absolute",
        bottom: 8,
        right: 8,
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: "0.65rem",
        color: "#2a2318",
        background: "rgba(245,240,232,0.85)",
        padding: "2px 6px",
        letterSpacing: "0.08em",
        borderRadius: 2,
        border: "1px solid #c8b89a",
      }}>
        {time}
      </div>
    </div>
  )
}
