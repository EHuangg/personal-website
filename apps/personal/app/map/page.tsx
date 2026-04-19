"use client"

import { useEffect, useRef, useCallback } from "react"
import gsap from "gsap"
import PageShell from "../components/PageShell"

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? ""
// Dark monochrome style — red/black/white aligned
const MAP_STYLE_URL = "mapbox://styles/mapbox/dark-v11"

declare global {
  interface Window {
    mapboxgl?: {
      accessToken: string
      Map: new (opts: Record<string, unknown>) => MapboxMap
      NavigationControl: new (opts?: Record<string, unknown>) => object
    }
  }
}

type MapboxMap = {
  on: (event: string, layerId: string | (() => void), cb?: () => void) => void
  resize: () => void
  remove: () => void
  panBy: (offset: [number, number], opts?: Record<string, unknown>) => void
  setPaintProperty: (layer: string, prop: string, value: unknown) => void
  getStyle: () => { layers?: { id: string; type: string }[] }
}

function loadMapbox(): Promise<void> {
  return new Promise((resolve) => {
    if (window.mapboxgl) { resolve(); return }
    if (!document.getElementById("mb-css")) {
      const link = document.createElement("link")
      link.id = "mb-css"
      link.rel = "stylesheet"
      link.href = "https://api.mapbox.com/mapbox-gl-js/v3.3.0/mapbox-gl.css"
      document.head.appendChild(link)
    }
    if (!document.getElementById("mb-js")) {
      const script = document.createElement("script")
      script.id = "mb-js"
      script.src = "https://api.mapbox.com/mapbox-gl-js/v3.3.0/mapbox-gl.js"
      script.onload = () => resolve()
      document.head.appendChild(script)
      return
    }
    const timer = setInterval(() => {
      if (window.mapboxgl) { clearInterval(timer); resolve() }
    }, 100)
  })
}

export default function MapPage() {
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<MapboxMap | null>(null)

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

  useEffect(() => {
    if (!MAPBOX_TOKEN || !mapContainerRef.current) return
    let cancelled = false

    loadMapbox().then(() => {
      if (cancelled || mapRef.current || !mapContainerRef.current || !window.mapboxgl) return
      window.mapboxgl.accessToken = MAPBOX_TOKEN
      const map = new window.mapboxgl.Map({
        container: mapContainerRef.current,
        style: MAP_STYLE_URL,
        center: [-79.55, 43.72],
        zoom: 6.95,
        pitch: 0,
        bearing: 0,
        interactive: true,
        attributionControl: false,
      })
      map.on("load", () => {
        if (cancelled) return
        map.resize()
        mapRef.current = map
      })
      const ro = new ResizeObserver(() => map.resize())
      ro.observe(mapContainerRef.current)
    })

    return () => {
      cancelled = true
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [])

  return (
    <PageShell>
      <div className="noir-section-title">
        <span className="title-outline">FIND</span>
        <span className="title-red">ME</span>
      </div>

      <div className="noir-container" style={{ paddingBottom: "clamp(40px, 5vw, 80px)" }}>
        <div className="map-wrapper">
          <div ref={mapContainerRef} className="map-canvas" />
          <div className="map-overlay-label">TORONTO</div>
        </div>
      </div>
    </PageShell>
  )
}
