"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import dynamic from "next/dynamic"
import { siteConfig } from "@personal-website/shared"

const VisitorFooter = dynamic(() => import("./components/VisitorFooter"), { ssr: false })

// ── Types ─────────────────────────────────────────────────────────────────────

type PinId = "evan" | "uow" | "blackberry" | "compugen" | "projects"

type Pin = {
  id: PinId
  label: string
  sub: string
  icon: string
  emoji: string
  iconBg: string
  lng: number
  lat: number
  zoom: number
  notFound?: boolean
}

const PINS: Pin[] = [
  { id: "evan",       label: "Evan Huang",             sub: "Oakville, ON",                           icon: "🏠", emoji: "👤", iconBg: "#0a84ff", lng: -79.6877,           lat: 43.4675,           zoom: 13 },
  { id: "uow",        label: "University of Waterloo", sub: "Waterloo, ON · B.Sc. Mathematics",        icon: "🎓", emoji: "🎓", iconBg: "#ff9500", lng: -80.5448,           lat: 43.4723,           zoom: 15 },
  { id: "blackberry", label: "BlackBerry",             sub: "Waterloo, ON · Network Engineer Intern",  icon: "💼", emoji: "🫐", iconBg: "#30b94d", lng: -80.5134953274364,  lat: 43.517182158766694, zoom: 15 },
  { id: "compugen",   label: "Compugen Inc.",          sub: "Richmond Hill, ON · Network Ops Intern",  icon: "💼", emoji: "🖥",  iconBg: "#30b94d", lng: -79.38721826149013, lat: 43.88987797031746,  zoom: 14 },
  { id: "projects",   label: "Projects",               sub: "Location not found",                     icon: "📁", emoji: "⚡", iconBg: "#8e8e93", lng: -150.0,             lat: 20.0,              zoom: 4, notFound: true },
]

// ── Courses ───────────────────────────────────────────────────────────────────

type Course = { code: string; name: string; url: string; tags: string[] }

const COURSES: Course[] = [
  { code: "CS 136",   name: "Elementary Algorithm Design and Data Abstraction", url: "https://ucalendar.uwaterloo.ca/2324/COURSE/course-CS.html#CS136",   tags: ["C"] },
  { code: "CS 234",   name: "Data Types and Structures",                        url: "https://ucalendar.uwaterloo.ca/2324/COURSE/course-CS.html#CS234",   tags: ["Python"] },
  { code: "CS 338",   name: "Computer Applications in Business: Databases",     url: "https://ucalendar.uwaterloo.ca/2324/COURSE/course-CS.html#CS338",   tags: ["SQL"] },
  { code: "CS 430",   name: "Applications Software Engineering",                url: "https://ucalendar.uwaterloo.ca/2324/COURSE/course-CS.html#CS430",   tags: ["Python"] },
  { code: "CS 431",   name: "Data-Intensive Distributed Analytics",             url: "https://ucalendar.uwaterloo.ca/2324/COURSE/course-CS.html#CS431",   tags: ["Python", "Spark", "Git"] },
  { code: "STAT 341", name: "Computational Statistics and Data Analysis",       url: "https://ucalendar.uwaterloo.ca/2324/COURSE/course-STAT.html#STAT341", tags: ["R"] },
]

// ── Detail content ─────────────────────────────────────────────────────────────

function UoWDetail() {
  return (
    <div className="pin-detail">
      <p className="pin-detail-meta">Sep 2020 – Dec 2025</p>
      <p className="pin-detail-meta">B.Sc. Mathematics · Economics Minor</p>
      <p className="pin-detail-bio" style={{ marginBottom: "0.75rem" }}>Relevant coursework:</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {COURSES.map((c) => (
          <div key={c.code} style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "5px 0", borderBottom: "0.5px solid var(--ink-faint)", flexWrap: "wrap" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "var(--ink-muted)", flexShrink: 0, minWidth: 60 }}>{c.code}</span>
            <a href={c.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.76rem", color: "var(--blue)", textDecoration: "none", flex: 1, minWidth: 0 }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.textDecoration = "underline" }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.textDecoration = "none" }}>
              {c.name}
            </a>
            <div style={{ display: "flex", gap: 3, flexShrink: 0 }}>
              {c.tags.map((t) => <span key={t} className="pin-detail-tag">{t}</span>)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ExperienceDetail({ job }: { job: typeof siteConfig.experience[0] }) {
  return (
    <div className="pin-detail">
      <p className="pin-detail-meta">{job.period}</p>
      <ul className="pin-detail-points">
        {job.points.map((p, i) => <li key={i}>{p}</li>)}
      </ul>
      <div className="pin-detail-tags">
        {job.tags.map((t) => <span key={t} className="pin-detail-tag">{t}</span>)}
      </div>
    </div>
  )
}

function ProjectsDetail() {
  return (
    <div className="pin-detail">
      <p className="pin-detail-bio" style={{ marginBottom: "0.75rem", fontStyle: "italic" }}>Location not found — searching…</p>
      {siteConfig.projects.map((p) => (
        <div key={p.name} style={{ marginBottom: "0.9rem" }}>
          <a href={p.url} target="_blank" rel="noopener noreferrer" className="pin-detail-link">{p.name} ↗</a>
          <p className="pin-detail-bio" style={{ marginTop: "0.2rem" }}>{p.description}</p>
          <div className="pin-detail-tags" style={{ marginTop: "0.3rem" }}>
            {p.tags.map((t) => <span key={t} className="pin-detail-tag">{t}</span>)}
          </div>
        </div>
      ))}
    </div>
  )
}

function EvanDetail() {
  return (
    <div className="pin-detail">
      <p className="pin-detail-bio">{siteConfig.bio}</p>
    </div>
  )
}

// ── Map helpers ────────────────────────────────────────────────────────────────

declare global {
  interface Window {
    mapboxgl: {
      accessToken: string
      Map: new (opts: object) => MapboxMap
      NavigationControl: new (opts?: object) => object
    }
  }
}

type MapboxMap = {
  flyTo: (opts: object) => void
  addControl: (control: object, position?: string) => void
  addSource: (id: string, source: object) => void
  addLayer: (layer: object) => void
  addImage: (id: string, data: object, opts?: object) => void
  updateImage: (id: string, data: object) => void
  hasImage: (id: string) => boolean
  removeImage: (id: string) => void
  triggerRepaint: () => void
  getSource: (id: string) => { setData: (data: object) => void } | undefined
  hasLayer: (id: string) => boolean
  setLayoutProperty: (layer: string, prop: string, value: unknown) => void
  on: (event: string, layerId: string | (() => void), cb?: (e: { features?: { properties?: { id?: string } }[] }) => void) => void
  getCanvas: () => HTMLCanvasElement
  remove: () => void
}

function loadMapbox(): Promise<void> {
  return new Promise((resolve) => {
    if (window.mapboxgl) { resolve(); return }
    if (!document.getElementById("mb-css")) {
      const l = document.createElement("link"); l.id = "mb-css"; l.rel = "stylesheet"
      l.href = "https://api.mapbox.com/mapbox-gl-js/v3.3.0/mapbox-gl.css"
      document.head.appendChild(l)
    }
    if (!document.getElementById("mb-js")) {
      const s = document.createElement("script"); s.id = "mb-js"
      s.src = "https://api.mapbox.com/mapbox-gl-js/v3.3.0/mapbox-gl.js"
      s.onload = () => resolve(); document.head.appendChild(s)
    } else {
      const c = setInterval(() => { if (window.mapboxgl) { clearInterval(c); resolve() } }, 100)
    }
  })
}

const SIDEBAR_MAP_STYLE = {
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
    { id: "water", type: "fill", source: "mapbox-streets", "source-layer": "water", paint: { "fill-color": "#ddd2bf" } },
    { id: "parks", type: "fill", source: "mapbox-streets", "source-layer": "landuse", filter: ["==", "class", "park"], paint: { "fill-color": "#ebe2d4" } },
    { id: "roads-minor", type: "line", source: "mapbox-streets", "source-layer": "road", filter: ["in", "class", "street", "street_limited", "service"], paint: { "line-color": "#c8b89a", "line-width": 0.7 } },
    { id: "roads-major", type: "line", source: "mapbox-streets", "source-layer": "road", filter: ["in", "class", "primary", "secondary", "tertiary"], paint: { "line-color": "#b39f82", "line-width": 1.3 } },
    { id: "roads-highway", type: "line", source: "mapbox-streets", "source-layer": "road", filter: ["in", "class", "motorway", "trunk"], paint: { "line-color": "#927f66", "line-width": 2.2 } },
    { id: "building", type: "fill", source: "mapbox-streets", "source-layer": "building", paint: { "fill-color": "#e8decd", "fill-outline-color": "#c8b89a" } },
    {
      id: "road-labels",
      type: "symbol",
      source: "mapbox-streets",
      "source-layer": "road",
      layout: {
        "text-field": ["get", "name"],
        "text-font": ["DIN Pro Regular", "Arial Unicode MS Regular"],
        "text-size": 10,
        "symbol-placement": "line",
      },
      paint: {
        "text-color": "#6a5a42",
        "text-halo-color": "#f5f0e8",
        "text-halo-width": 1,
      },
    },
  ],
}

// ── Clock ──────────────────────────────────────────────────────────────────────

function Clock() {
  const [time, setTime] = useState("")
  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString("en-CA", {
      timeZone: "America/Toronto", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
    }))
    tick()
    const t = setInterval(tick, 1000)
    return () => clearInterval(t)
  }, [])
  return (
    <div style={{
      padding: "0.4rem 0.75rem",
      background: "rgba(200,184,154,0.15)",
      borderTop: "0.5px solid var(--ink-faint)",
      display: "flex", justifyContent: "space-between", alignItems: "center",
      fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "var(--ink-muted)",
      flexShrink: 0,
    }}>
      <span>EST / Toronto</span>
      <span style={{ color: "var(--ink)", letterSpacing: "0.06em" }}>{time}</span>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function FindEvan() {
  const mapRef = useRef<MapboxMap | null>(null)
  const sheetStartYRef = useRef<number | null>(null)
  const sheetDraggingRef = useRef(false)
  const sheetCanDragRef = useRef(false)
  const sheetOffsetRef = useRef(0)
  const sheetScrollRef = useRef<HTMLDivElement | null>(null)
  const [activePin, setActivePin] = useState<PinId | null>(null)
  const [expandedPin, setExpandedPin] = useState<PinId | null>(null)
  const [sheetOffsetY, setSheetOffsetY] = useState(0)
  const [mapReady, setMapReady] = useState(false)
  const [showVisitorPins, setShowVisitorPins] = useState(false)
  const [visitorPins, setVisitorPins] = useState<{ id: string; lat: number; lng: number; pixel_art: string }[]>([])

  const geojsonData = useCallback((active: PinId | null) => ({
    type: "FeatureCollection",
    features: PINS.map((pin) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [pin.lng, pin.lat] },
      properties: { id: pin.id, icon: `pin-${pin.id}-${pin.id === active ? "active" : "idle"}` },
    })),
  }), [])

  const drawPinImage = useCallback((pin: Pin, active: boolean): Promise<HTMLCanvasElement> => {
    return new Promise((resolve) => {
      const size = active ? 80 : 60
      const c = document.createElement("canvas")
      c.width = size; c.height = size
      const ctx = c.getContext("2d")!
      const cx = size / 2, cy = size / 2, r = size / 2 - 3

      const draw = (img?: HTMLImageElement) => {
        ctx.clearRect(0, 0, size, size)
        ctx.shadowColor = "rgba(0,0,0,0.28)"
        ctx.shadowBlur = active ? 10 : 6
        ctx.shadowOffsetY = 2
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2)
        ctx.fillStyle = "white"; ctx.fill()
        ctx.shadowColor = "transparent"
        ctx.save()
        ctx.beginPath(); ctx.arc(cx, cy, r - 3, 0, Math.PI * 2); ctx.clip()
        if (img) {
          ctx.drawImage(img, 0, 0, size, size)
        } else {
          ctx.fillStyle = pin.notFound ? "#8e8e93" : pin.iconBg
          ctx.fillRect(0, 0, size, size)
          ctx.fillStyle = "white"
          ctx.font = `bold ${active ? 26 : 19}px sans-serif`
          ctx.textAlign = "center"; ctx.textBaseline = "middle"
          ctx.fillText(pin.emoji, cx, cy)
        }
        ctx.restore()
        if (active && !pin.notFound) {
          ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2)
          ctx.strokeStyle = pin.iconBg; ctx.lineWidth = 2.5; ctx.stroke()
        }
        resolve(c)
      }
      if (!pin.notFound) {
        const img = new Image()
        img.onload = () => draw(img); img.onerror = () => draw()
        img.src = `/pins/${pin.id}.jpg`
      } else { draw() }
    })
  }, [])

  // Sync/toggle a pin — used by both sidebar clicks and map clicks
  const togglePin = useCallback((id: PinId) => {
    setActivePin((prev) => {
      const next = prev === id ? null : id
      if (next) {
        const pin = PINS.find((p) => p.id === id)!
        mapRef.current?.flyTo({ center: [pin.lng, pin.lat], zoom: pin.zoom, duration: 1200, essential: true })
        if (id !== "projects") setExpandedPin(id)
        else setExpandedPin(null)
      } else {
        setExpandedPin(null)
        const prev_pin = PINS.find((p) => p.id === id)!
        mapRef.current?.flyTo({ center: [prev_pin.lng, prev_pin.lat], zoom: prev_pin.zoom - 2, duration: 900, essential: true })
      }
      mapRef.current?.getSource("pins")?.setData(geojsonData(next) as unknown as object)
      return next
    })
  }, [geojsonData])

  // Init map
  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
    if (!token) return
    let cancelled = false

    loadMapbox().then(() => {
      if (cancelled || mapRef.current) return
      window.mapboxgl.accessToken = token
      const map = new window.mapboxgl.Map({
        container: "mapbox-container",
        style: SIDEBAR_MAP_STYLE as unknown as object,
        center: [PINS[0].lng, PINS[0].lat],
        zoom: PINS[0].zoom,
        attributionControl: false,
      })
      map.addControl(new window.mapboxgl.NavigationControl({ showCompass: false }), "bottom-right")

      map.on("load", () => {
        if (cancelled) return
        const registerAll = PINS.filter(p => !p.notFound).flatMap((pin) =>
          (["idle", "active"] as const).map(async (state) => {
            const key = `pin-${pin.id}-${state}`
            if (map.hasImage(key)) return
            const canvas = await drawPinImage(pin, state === "active")
            const imgData = canvas.getContext("2d")!.getImageData(0, 0, canvas.width, canvas.height)
            map.addImage(key, { width: canvas.width, height: canvas.height, data: new Uint8Array(imgData.data.buffer) })
          })
        )

        Promise.all(registerAll).then(() => {
          if (cancelled) return
          const size = 60
          let angle = 0
          const animatedImage = {
            width: size, height: size,
            data: new Uint8Array(size * size * 4),
            onAdd() {},
            render() {
              const c = document.createElement("canvas"); c.width = size; c.height = size
              const ctx = c.getContext("2d")!
              const cx = size / 2, cy = size / 2, r = size / 2 - 3
              ctx.shadowColor = "rgba(0,0,0,0.2)"; ctx.shadowBlur = 5; ctx.shadowOffsetY = 1
              ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fillStyle = "white"; ctx.fill()
              ctx.shadowColor = "transparent"
              ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, r - 3, 0, Math.PI * 2); ctx.clip()
              ctx.fillStyle = "#8e8e93"; ctx.fillRect(0, 0, size, size)
              ctx.fillStyle = "rgba(255,255,255,0.5)"; ctx.font = "bold 18px sans-serif"
              ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("📁", cx, cy)
              ctx.restore()
              ctx.beginPath(); ctx.arc(cx, cy, r - 1, angle, angle + Math.PI * 0.7)
              ctx.strokeStyle = "#30b94d"; ctx.lineWidth = 2; ctx.lineCap = "round"; ctx.stroke()
              angle += 0.06
              const d = ctx.getImageData(0, 0, size, size); this.data = new Uint8Array(d.data.buffer)
              map.triggerRepaint(); return true
            },
          }
          if (!map.hasImage("pin-projects-idle")) map.addImage("pin-projects-idle", animatedImage as unknown as { width: number; height: number; data: Uint8Array }, { pixelRatio: 1 })
          if (!map.hasImage("pin-projects-active")) map.addImage("pin-projects-active", animatedImage as unknown as { width: number; height: number; data: Uint8Array }, { pixelRatio: 1 })

          map.addSource("pins", { type: "geojson", data: geojsonData(null) })
          map.addLayer({ id: "pins-layer", type: "symbol", source: "pins", layout: { "icon-image": ["get", "icon"], "icon-allow-overlap": true, "icon-ignore-placement": true, "icon-anchor": "center", "icon-size": 1 } })

          map.addSource("visitor-pins", { type: "geojson", data: { type: "FeatureCollection", features: [] } })
          map.addLayer({ id: "visitor-pins-layer", type: "symbol", source: "visitor-pins", layout: { "icon-image": ["get", "icon"], "icon-allow-overlap": true, "icon-ignore-placement": true, "icon-anchor": "center", "icon-size": 1, "visibility": "none" } })

          map.on("click", "pins-layer", (e) => {
            const id = e.features?.[0]?.properties?.id as PinId | undefined
            if (id) togglePin(id)
          })
          map.on("mouseenter", "pins-layer", () => { map.getCanvas().style.cursor = "pointer" })
          map.on("mouseleave", "pins-layer", () => { map.getCanvas().style.cursor = "" })

          mapRef.current = map
          setMapReady(true)
        })
      })
    })
    return () => {
      cancelled = true; mapRef.current?.remove(); mapRef.current = null
    }
  }, [geojsonData, drawPinImage, togglePin])

  // Sync visitor pins
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady) return
    try {
      map.setLayoutProperty("visitor-pins-layer", "visibility", showVisitorPins && visitorPins.length > 0 ? "visible" : "none")
    } catch { return } // layer not yet re-added after style switch
    if (!showVisitorPins) return
    if (visitorPins.length === 0) {
      map.getSource("visitor-pins")?.setData({ type: "FeatureCollection", features: [] } as unknown as object)
      return
    }
    const registerAndRender = async () => {
      const features: object[] = []
      for (const vp of visitorPins) {
        const imgId = `vpin-${vp.id}`
        if (!map.hasImage(imgId)) {
          const vw = 52, vh = 52
          const c = document.createElement("canvas"); c.width = vw + 12; c.height = vh + 10
          const ctx = c.getContext("2d")!; const ox = 4, oy = 2
          ctx.save()
          ctx.shadowColor = "rgba(0,0,0,0.22)"; ctx.shadowBlur = 5; ctx.shadowOffsetX = 1; ctx.shadowOffsetY = 3
          const bodyGrad = ctx.createLinearGradient(ox, oy, ox, oy + vh)
          bodyGrad.addColorStop(0, "#fef08a"); bodyGrad.addColorStop(0.5, "#fde047"); bodyGrad.addColorStop(1, "#facc15")
          ctx.fillStyle = bodyGrad; ctx.fillRect(ox, oy, vw, vh); ctx.restore()
          const img = new Image(); img.src = vp.pixel_art
          await new Promise<void>((res) => { img.onload = () => res(); img.onerror = () => res() })
          ctx.save(); ctx.beginPath(); ctx.rect(ox + 6, oy + 6, vw - 12, vh - 12); ctx.clip()
          ctx.imageSmoothingEnabled = false; ctx.drawImage(img, ox + 6, oy + 6, vw - 12, vh - 12); ctx.restore()
          const d = ctx.getImageData(0, 0, c.width, c.height)
          map.addImage(imgId, { width: c.width, height: c.height, data: new Uint8Array(d.data.buffer) })
        }
        features.push({ type: "Feature", geometry: { type: "Point", coordinates: [vp.lng, vp.lat] }, properties: { icon: `vpin-${vp.id}` } })
      }
      map.getSource("visitor-pins")?.setData({ type: "FeatureCollection", features } as unknown as object)
      try { map.setLayoutProperty("visitor-pins-layer", "visibility", features.length > 0 ? "visible" : "none") } catch {}
    }
    registerAndRender()
  }, [showVisitorPins, visitorPins, mapReady])

  // ── Render ──────────────────────────────────────────────────────────────────

  const expandedPinData = expandedPin ? PINS.find(p => p.id === expandedPin) : null

  useEffect(() => {
    setSheetOffsetY(0)
    sheetStartYRef.current = null
    sheetDraggingRef.current = false
    sheetCanDragRef.current = false
    sheetOffsetRef.current = 0
  }, [expandedPin])

  const handleSheetTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    sheetStartYRef.current = e.touches[0].clientY
    const target = e.target as HTMLElement
    const fromGrabber = !!target.closest(".mobile-detail-grabber")
    const atTop = (sheetScrollRef.current?.scrollTop ?? 0) <= 0
    sheetCanDragRef.current = fromGrabber || atTop
    sheetDraggingRef.current = sheetCanDragRef.current
  }, [])

  const handleSheetTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (!sheetDraggingRef.current || !sheetCanDragRef.current || sheetStartYRef.current === null) return
    const delta = e.touches[0].clientY - sheetStartYRef.current
    if (delta <= 0) {
      setSheetOffsetY(0)
      sheetOffsetRef.current = 0
      return
    }
    e.preventDefault()
    const next = Math.min(380, delta)
    setSheetOffsetY(next)
    sheetOffsetRef.current = next
  }, [])

  const handleSheetTouchEnd = useCallback(() => {
    if (!sheetDraggingRef.current) return
    sheetDraggingRef.current = false
    sheetCanDragRef.current = false
    sheetStartYRef.current = null

    if (sheetOffsetRef.current > 120 && expandedPin) {
      togglePin(expandedPin)
      return
    }

    setSheetOffsetY(0)
    sheetOffsetRef.current = 0
  }, [expandedPin, togglePin])

  return (
    <div className="app">
      <div className="topbar">
        <img src="/favicon.png" alt="icon" style={{ width: 24, height: 24, imageRendering: "pixelated" }} />
        <span className="topbar-title">Find Evan</span>
        <span className="topbar-subtitle">evan-huang.dev</span>
      </div>

      <div className="main">
        <aside className="sidebar">

          {/* ── Expanded detail ── */}
          <div className="sidebar-panel sidebar-panel--expanded" style={{ transform: expandedPin ? "translateX(0)" : "translateX(-100%)", opacity: expandedPin ? 1 : 0, pointerEvents: expandedPin ? "auto" : "none" }}>
            {expandedPinData && (
              <>
                <div className="sidebar-scroll">
                  <div style={{ padding: "0.75rem 1rem 0" }}>
                    <button onClick={() => togglePin(expandedPin!)} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--ink-muted)", padding: 0, marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: 4 }}>
                      ‹ back
                    </button>
                    {expandedPin === "evan" ? (
                      /* Full-width photo for Evan */
                      <div style={{ marginBottom: "0.75rem" }}>
                        <div style={{
                          width: "100%", aspectRatio: "1", borderRadius: 8,
                          overflow: "hidden", background: "#0a84ff",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          marginBottom: "0.6rem",
                        }}>
                          <img src="/pins/evan.jpg" alt="Evan Huang"
                            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none" }}
                            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                        </div>
                        <div className="hero-name" style={{ fontSize: "1.1rem" }}>Evan Huang</div>
                        <div className="hero-sub">Oakville, ON · Mathematics · UWaterloo</div>
                      </div>
                    ) : (
                      /* Small avatar + name for others */
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
                        <PinAvatar pin={expandedPinData} size={48} />
                        <div>
                          <div className="hero-name">{expandedPinData.label}</div>
                          <div className="hero-sub" style={{ fontSize: "0.72rem" }}>{expandedPinData.sub}</div>
                        </div>
                      </div>
                    )}
                  </div>
                  {expandedPin === "evan" && <EvanDetail />}
                  {expandedPin === "uow" && <UoWDetail />}
                  {expandedPin === "blackberry" && <ExperienceDetail job={siteConfig.experience[0]} />}
                  {expandedPin === "compugen" && <ExperienceDetail job={siteConfig.experience[1]} />}
                  {expandedPin === "projects" && <ProjectsDetail />}
                </div>
                <Clock />
                <VisitorFooter showPins={showVisitorPins} onToggle={setShowVisitorPins} onPinsLoaded={setVisitorPins} />
              </>
            )}
          </div>

          {/* ── List view ── */}
          <div className="sidebar-panel sidebar-panel--list" style={{ transform: expandedPin ? "translateX(100%)" : "translateX(0)", opacity: expandedPin ? 0 : 1, pointerEvents: expandedPin ? "none" : "auto" }}>
            <div className="sidebar-scroll">
              {/* Hero */}
              <div className={`hero-card ${activePin === "evan" ? "hero-card--active" : ""}`} onClick={() => togglePin("evan")}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <PinAvatar pin={PINS[0]} size={52} />
                  <div>
                    <div className="hero-name">Evan Huang</div>
                    <div className="hero-sub">Mathematics · UWaterloo<br />Software Dev · Network Infra</div>
                  </div>
                </div>
                <div className="hero-links" style={{ marginTop: "0.75rem" }}>
                  <a href={siteConfig.links.github} target="_blank" rel="noopener noreferrer" className="hero-link" onClick={(e) => e.stopPropagation()}>github ↗</a>
                  <a href={`mailto:${siteConfig.links.email}`} className="hero-link" onClick={(e) => e.stopPropagation()}>email ↗</a>
                  <a href={siteConfig.links.linkedin} target="_blank" rel="noopener noreferrer" className="hero-link" onClick={(e) => e.stopPropagation()}>linkedin ↗</a>
                  <a href={siteConfig.links.resume} download className="hero-link" onClick={(e) => e.stopPropagation()}>resume ↓</a>
                </div>
              </div>

              <div className="sidebar-divider" />
              <div style={{ padding: "0.5rem 1rem", display: "flex", flexWrap: "wrap", gap: 4 }}>
                {["Python", "TypeScript", "Next.js", "PostgreSQL", "AWS", "Linux"].map((t) => (
                  <span key={t} className="pin-detail-tag">{t}</span>
                ))}
              </div>
              <div className="sidebar-divider" />
              <div className="section-label">Education</div>
              {PINS.filter(p => p.id === "uow").map(pin => (
                <PinRow key={pin.id} pin={pin} active={activePin === pin.id} onClick={() => togglePin(pin.id)} />
              ))}

              <div className="sidebar-divider" />
              <div className="section-label">Experience</div>
              {PINS.filter(p => p.id === "blackberry" || p.id === "compugen").map(pin => {
                const job = siteConfig.experience.find(j => j.company.toLowerCase().includes(pin.id === "blackberry" ? "black" : "comp"))
                return <PinRow key={pin.id} pin={pin} active={activePin === pin.id} onClick={() => togglePin(pin.id)} role={job?.role} date={job?.period} />
              })}

              <div className="sidebar-divider" />
              <div className="section-label">Projects</div>
              {PINS.filter(p => p.id === "projects").map(pin => (
                <PinRow key={pin.id} pin={pin} active={activePin === pin.id} onClick={() => togglePin(pin.id)} />
              ))}
              {activePin === "projects" && <ProjectsDetail />}
            </div>
            <Clock />
            <VisitorFooter showPins={showVisitorPins} onToggle={setShowVisitorPins} onPinsLoaded={setVisitorPins} />
          </div>
        </aside>

        <div className="map-wrap">
          <div id="mapbox-container" />
          {!mapReady && (
            <div style={{ position: "absolute", inset: 0, background: "#e8e0d4", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "#9a8a72" }}>
              loading map...
            </div>
          )}
        </div>
      </div>

      {expandedPinData && (
        <>
          <div className="mobile-detail-backdrop" onClick={() => togglePin(expandedPinData.id)} />
          <div
            className={`mobile-detail-sheet ${sheetDraggingRef.current ? "dragging" : ""}`}
            style={{ transform: `translateY(${sheetOffsetY}px)` }}
            onTouchStart={handleSheetTouchStart}
            onTouchMove={handleSheetTouchMove}
            onTouchEnd={handleSheetTouchEnd}
            onTouchCancel={handleSheetTouchEnd}
          >
            <div className="mobile-detail-grabber" />
            <div className="sidebar-scroll" ref={sheetScrollRef} style={{ paddingBottom: "1rem" }}>
              <div style={{ padding: "0.75rem 1rem 0" }}>
                <button onClick={() => togglePin(expandedPinData.id)} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--ink-muted)", padding: 0, marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: 4 }}>
                  ‹ back
                </button>
                {expandedPinData.id === "evan" ? (
                  <div style={{ marginBottom: "0.75rem" }}>
                    <div style={{
                      width: "100%", aspectRatio: "1", borderRadius: 8,
                      overflow: "hidden", background: "#0a84ff",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      marginBottom: "0.6rem",
                    }}>
                      <img src="/pins/evan.jpg" alt="Evan Huang"
                        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none" }}
                        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                    </div>
                    <div className="hero-name" style={{ fontSize: "1.1rem" }}>Evan Huang</div>
                    <div className="hero-sub">Oakville, ON · Mathematics · UWaterloo</div>
                  </div>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
                    <PinAvatar pin={expandedPinData} size={48} />
                    <div>
                      <div className="hero-name">{expandedPinData.label}</div>
                      <div className="hero-sub" style={{ fontSize: "0.72rem" }}>{expandedPinData.sub}</div>
                    </div>
                  </div>
                )}
              </div>
              {expandedPinData.id === "evan" && <EvanDetail />}
              {expandedPinData.id === "uow" && <UoWDetail />}
              {expandedPinData.id === "blackberry" && <ExperienceDetail job={siteConfig.experience[0]} />}
              {expandedPinData.id === "compugen" && <ExperienceDetail job={siteConfig.experience[1]} />}
              {expandedPinData.id === "projects" && <ProjectsDetail />}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function PinAvatar({ pin, size = 36 }: { pin: Pin; size?: number }) {
  const [err, setErr] = useState(false)
  if (pin.notFound) {
    return (
      <div style={{ width: size, height: size, borderRadius: "50%", background: "#8e8e93", border: "2px solid white", boxShadow: "0 1px 4px rgba(0,0,0,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.45, flexShrink: 0, position: "relative", overflow: "hidden" }}>
        <span style={{ filter: "brightness(0) invert(0.5)" }}>📁</span>
        <div style={{ position: "absolute", inset: -2, borderRadius: "50%", border: "2.5px solid transparent", borderTopColor: "#30b94d", borderRightColor: "#30b94d", animation: "spin 1s linear infinite" }} />
      </div>
    )
  }
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", border: "2px solid white", boxShadow: "0 1px 4px rgba(0,0,0,0.2)", overflow: "hidden", flexShrink: 0, background: pin.iconBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.45 }}>
      {!err ? (
        <img src={`/pins/${pin.id}.jpg`} alt={pin.label} onError={() => setErr(true)} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
      ) : (
        <span>{pin.emoji}</span>
      )}
    </div>
  )
}

function PinRow({ pin, active, onClick, role, date }: { pin: Pin; active: boolean; onClick: () => void; role?: string; date?: string }) {
  return (
    <div className={`pin-card ${active ? "pin-card--active" : ""}`} onClick={onClick}>
      <PinAvatar pin={pin} size={36} />
      <div className="pin-card-body">
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "0.5rem" }}>
          <div className="pin-card-name" style={{ flexShrink: 0 }}>{pin.label}</div>
          {date && <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.62rem", color: "var(--ink-muted)", whiteSpace: "nowrap" }}>{date}</span>}
        </div>
        <div className="pin-card-sub">
          {pin.notFound ? (
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#ff9500", display: "inline-block" }} />
              Location not found
            </span>
          ) : role ?? pin.sub}
        </div>
      </div>
      <span className="pin-chevron">›</span>
    </div>
  )
}
