"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import dynamic from "next/dynamic"
import { siteConfig } from "@personal-website/shared"

const VisitorFooter = dynamic(() => import("./components/VisitorFooter"), { ssr: false })

// ── Pin data ──────────────────────────────────────────────────────────────────

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
  { id: "evan",       label: "Evan Huang",              sub: "Oakville, ON",                          icon: "🏠", emoji: "👤", iconBg: "#0a84ff", lng: -79.6877, lat: 43.4675, zoom: 13 },
  { id: "uow",        label: "University of Waterloo",  sub: "Waterloo, ON · B.Sc Mathematics",       icon: "🎓", emoji: "🎓", iconBg: "#ff9500", lng: -80.5448, lat: 43.4723, zoom: 15 },
  { id: "blackberry", label: "BlackBerry",              sub: "Waterloo, ON · Network Engineer Intern", icon: "💼", emoji: "🫐", iconBg: "#30b94d", lng: -80.5134953274364, lat: 43.517182158766694, zoom: 15 },
  { id: "compugen",   label: "Compugen Inc.",           sub: "Richmond Hill, ON · Network Ops Intern", icon: "💼", emoji: "🖥",  iconBg: "#30b94d", lng: -79.38721826149013, lat: 43.88987797031746, zoom: 14 },
  { id: "projects",   label: "Projects",                sub: "Location not found",                    icon: "📁", emoji: "⚡", iconBg: "#8e8e93", lng: -150.0000, lat: 20.0000, zoom: 4,  notFound: true },
]

const DETAIL: Record<PinId, React.ReactNode> = {
  evan: (
    <div className="pin-detail">
      <p className="pin-detail-bio">{siteConfig.bio}</p>
      <div className="pin-detail-tags">
        {["Python", "JavaScript", "TypeScript", "Node.js", "React", "SQL", "AWS", "Linux"].map((t) => (
          <span key={t} className="pin-detail-tag">{t}</span>
        ))}
      </div>
    </div>
  ),
  uow: (
    <div className="pin-detail">
      <p className="pin-detail-meta">Sep 2020 – Dec 2025</p>
      <p className="pin-detail-bio">Honours Bachelor of Science in Mathematics. Coursework in software engineering, distributed analytics, algorithms, databases, and linear optimization.</p>
    </div>
  ),
  blackberry: (
    <div className="pin-detail">
      <p className="pin-detail-meta">Jan 2024 – Aug 2024</p>
      <ul className="pin-detail-points">
        {siteConfig.experience[0].points.map((p, i) => <li key={i}>{p}</li>)}
      </ul>
      <div className="pin-detail-tags">
        {siteConfig.experience[0].tags.map((t) => <span key={t} className="pin-detail-tag">{t}</span>)}
      </div>
    </div>
  ),
  compugen: (
    <div className="pin-detail">
      <p className="pin-detail-meta">Apr 2022 – Dec 2022</p>
      <ul className="pin-detail-points">
        {siteConfig.experience[1].points.map((p, i) => <li key={i}>{p}</li>)}
      </ul>
      <div className="pin-detail-tags">
        {siteConfig.experience[1].tags.map((t) => <span key={t} className="pin-detail-tag">{t}</span>)}
      </div>
    </div>
  ),
  projects: (
    <div className="pin-detail">
      {siteConfig.projects.map((p) => (
        <div key={p.name} style={{ marginBottom: "0.75rem" }}>
          <a href={p.url} target="_blank" rel="noopener noreferrer" className="pin-detail-link">
            {p.name} ↗
          </a>
          <p className="pin-detail-bio" style={{ marginTop: "0.2rem" }}>{p.description}</p>
        </div>
      ))}
    </div>
  ),
}

// ── Map helpers ───────────────────────────────────────────────────────────────

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
  triggerRepaint: () => void
  getSource: (id: string) => { setData: (data: object) => void } | undefined
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

// ── Main component ────────────────────────────────────────────────────────────

export default function FindEvan() {
  const mapRef = useRef<MapboxMap | null>(null)
  const [activePin, setActivePin] = useState<PinId | null>(null)
  const [mapReady, setMapReady] = useState(false)
  const [showVisitorPins, setShowVisitorPins] = useState(false)
  const [visitorPins, setVisitorPins] = useState<{ id: string; lat: number; lng: number; pixel_art: string }[]>([])

  // Load an image and draw circular pin — returns Promise<canvas>
  const drawPinImage = useCallback((pin: Pin, active: boolean): Promise<HTMLCanvasElement> => {
    return new Promise((resolve) => {
      const size = active ? 80 : 60
      const c = document.createElement("canvas")
      c.width = size; c.height = size
      const ctx = c.getContext("2d")!
      const cx = size / 2, cy = size / 2, r = size / 2 - 3

      const draw = (img?: HTMLImageElement) => {
        ctx.clearRect(0, 0, size, size)

        // Drop shadow
        ctx.shadowColor = "rgba(0,0,0,0.28)"
        ctx.shadowBlur = active ? 10 : 6
        ctx.shadowOffsetY = 2

        // White border
        ctx.beginPath()
        ctx.arc(cx, cy, r, 0, Math.PI * 2)
        ctx.fillStyle = "white"
        ctx.fill()
        ctx.shadowColor = "transparent"

        // Clip circle
        ctx.save()
        ctx.beginPath()
        ctx.arc(cx, cy, r - 3, 0, Math.PI * 2)
        ctx.clip()

        if (img) {
          // Draw profile photo
          ctx.drawImage(img, 0, 0, size, size)
        } else {
          // Fallback: colored bg + emoji
          ctx.fillStyle = pin.notFound ? "#8e8e93" : pin.iconBg
          ctx.fillRect(0, 0, size, size)
          ctx.fillStyle = "white"
          ctx.font = `bold ${active ? 26 : 19}px sans-serif`
          ctx.textAlign = "center"
          ctx.textBaseline = "middle"
          ctx.fillText(pin.emoji, cx, cy)
        }

        ctx.restore()

        // Active ring
        if (active && !pin.notFound) {
          ctx.beginPath()
          ctx.arc(cx, cy, r, 0, Math.PI * 2)
          ctx.strokeStyle = pin.iconBg
          ctx.lineWidth = 2.5
          ctx.stroke()
        }

        resolve(c)
      }

      // Try loading photo from /pins/{id}.jpg
      if (!pin.notFound) {
        const img = new Image()
        img.onload = () => draw(img)
        img.onerror = () => draw()
        img.src = `/pins/${pin.id}.jpg`
      } else {
        draw()
      }
    })
  }, [])

  const geojsonData = useCallback((active: PinId | null) => ({
    type: "FeatureCollection",
    features: PINS.map((pin) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [pin.lng, pin.lat] },
      properties: {
        id: pin.id,
        icon: `pin-${pin.id}-${pin.id === active ? "active" : "idle"}`,
      },
    })),
  }), [])

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
        style: "mapbox://styles/mapbox/streets-v12",
        center: [PINS[0].lng, PINS[0].lat],
        zoom: PINS[0].zoom,
        attributionControl: false,
      })

      map.addControl(new window.mapboxgl.NavigationControl({ showCompass: false }), "bottom-right")

      map.on("load", () => {
        if (cancelled) return

        // Register all pin images — await async image loading
        const registerAll = PINS.filter(p => !p.notFound).flatMap((pin) =>
          (["idle", "active"] as const).map(async (state) => {
            const key = `pin-${pin.id}-${state}`
            if (map.hasImage(key)) return
            const canvas = await drawPinImage(pin, state === "active")
            const imgData = canvas.getContext("2d")!.getImageData(0, 0, canvas.width, canvas.height)
            map.addImage(key, {
              width: canvas.width,
              height: canvas.height,
              data: new Uint8Array(imgData.data.buffer),
            })
          })
        )

        Promise.all(registerAll).then(() => {
          if (cancelled) return

          // Animated loading ring for projects
          const size = 60
          let angle = 0
          const animatedImage = {
            width: size, height: size,
            data: new Uint8Array(size * size * 4),
            onAdd() {},
            render() {
              const c = document.createElement("canvas")
              c.width = size; c.height = size
              const ctx = c.getContext("2d")!
              const cx = size / 2, cy = size / 2, r = size / 2 - 3

              ctx.shadowColor = "rgba(0,0,0,0.2)"
              ctx.shadowBlur = 5
              ctx.shadowOffsetY = 1
              ctx.beginPath()
              ctx.arc(cx, cy, r, 0, Math.PI * 2)
              ctx.fillStyle = "white"
              ctx.fill()
              ctx.shadowColor = "transparent"

              ctx.save()
              ctx.beginPath()
              ctx.arc(cx, cy, r - 3, 0, Math.PI * 2)
              ctx.clip()
              ctx.fillStyle = "#8e8e93"
              ctx.fillRect(0, 0, size, size)
              ctx.fillStyle = "rgba(255,255,255,0.5)"
              ctx.font = `bold 18px sans-serif`
              ctx.textAlign = "center"
              ctx.textBaseline = "middle"
              ctx.fillText("📁", cx, cy)
              ctx.restore()

              ctx.beginPath()
              ctx.arc(cx, cy, r - 1, angle, angle + Math.PI * 1.1)
              ctx.strokeStyle = "#30b94d"
              ctx.lineWidth = 4
              ctx.lineCap = "round"
              ctx.stroke()

              angle += 0.06

              const d = ctx.getImageData(0, 0, size, size)
              this.data = new Uint8Array(d.data.buffer)
              map.triggerRepaint()
              return true
            },
          }
          if (!map.hasImage("pin-projects-idle")) map.addImage("pin-projects-idle", animatedImage as unknown as { width: number; height: number; data: Uint8Array }, { pixelRatio: 1 })
          if (!map.hasImage("pin-projects-active")) map.addImage("pin-projects-active", animatedImage as unknown as { width: number; height: number; data: Uint8Array }, { pixelRatio: 1 })

          // GeoJSON source
          map.addSource("pins", {
            type: "geojson",
            data: geojsonData(null),
          })

          // Symbol layer
          map.addLayer({
            id: "pins-layer",
            type: "symbol",
            source: "pins",
            layout: {
              "icon-image": ["get", "icon"],
              "icon-allow-overlap": true,
              "icon-ignore-placement": true,
              "icon-anchor": "center",
              "icon-size": 1,
            },
          })

          // Visitor pins source + layer (hidden by default)
          map.addSource("visitor-pins", {
            type: "geojson",
            data: { type: "FeatureCollection", features: [] },
          })

          map.addLayer({
            id: "visitor-pins-layer",
            type: "symbol",
            source: "visitor-pins",
            layout: {
              "icon-image": ["get", "icon"],
              "icon-allow-overlap": true,
              "icon-ignore-placement": true,
              "icon-anchor": "center",
              "icon-size": 1,
              "visibility": "none",
            },
          })

          map.on("click", "pins-layer", (e) => {
            const id = e.features?.[0]?.properties?.id as PinId | undefined
            if (id) handlePinClick(id)
          })
          map.on("mouseenter", "pins-layer", () => { map.getCanvas().style.cursor = "pointer" })
          map.on("mouseleave", "pins-layer", () => { map.getCanvas().style.cursor = "" })

          mapRef.current = map
          setMapReady(true)
        })
      })
    })

    return () => {
      cancelled = true
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [geojsonData, drawPinImage])

  // Sync visitor pins to map
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady) return

    map.setLayoutProperty("visitor-pins-layer", "visibility", showVisitorPins ? "visible" : "none")

    if (!showVisitorPins || visitorPins.length === 0) return

    // Register each visitor pin image and build GeoJSON
    const registerAndRender = async () => {
      const features: object[] = []

      for (const vp of visitorPins) {
        const imgId = `vpin-${vp.id}`
        if (!map.hasImage(imgId)) {
          // Draw pixel art into a circular canvas
          const size = 44
          const c = document.createElement("canvas")
          c.width = size; c.height = size
          const ctx = c.getContext("2d")!
          const cx = size / 2, cy = size / 2, r = size / 2 - 2

          // White border
          ctx.shadowColor = "rgba(0,0,0,0.25)"
          ctx.shadowBlur = 5
          ctx.shadowOffsetY = 1
          ctx.beginPath()
          ctx.arc(cx, cy, r, 0, Math.PI * 2)
          ctx.fillStyle = "white"
          ctx.fill()
          ctx.shadowColor = "transparent"

          // Clip and draw pixel art
          ctx.save()
          ctx.beginPath()
          ctx.arc(cx, cy, r - 2.5, 0, Math.PI * 2)
          ctx.clip()

          const img = new Image()
          img.src = vp.pixel_art
          await new Promise<void>((res) => { img.onload = () => res(); img.onerror = () => res() })
          ctx.imageSmoothingEnabled = false
          ctx.drawImage(img, 0, 0, size, size)
          ctx.restore()

          // Red ring
          ctx.beginPath()
          ctx.arc(cx, cy, r, 0, Math.PI * 2)
          ctx.strokeStyle = "#ff3b30"
          ctx.lineWidth = 2
          ctx.stroke()

          const d = ctx.getImageData(0, 0, size, size)
          map.addImage(imgId, { width: size, height: size, data: new Uint8Array(d.data.buffer) })
        }

        features.push({
          type: "Feature",
          geometry: { type: "Point", coordinates: [vp.lng, vp.lat] },
          properties: { icon: `vpin-${vp.id}` },
        })
      }

      map.getSource("visitor-pins")?.setData({ type: "FeatureCollection", features } as unknown as object)
    }

    registerAndRender()
  }, [showVisitorPins, visitorPins, mapReady])

  const handlePinClick = useCallback((id: PinId) => {
    setActivePin((prev) => {
      const next = prev === id ? null : id
      const pin = PINS.find((p) => p.id === id)!
      if (next) {
        mapRef.current?.flyTo({ center: [pin.lng, pin.lat], zoom: pin.zoom, duration: 1200, essential: true })
      }
      mapRef.current?.getSource("pins")?.setData(geojsonData(next) as unknown as object)
      return next
    })
  }, [geojsonData])

  return (
    <div className="app">
      {/* Top bar */}
      <div className="topbar">
        <span className="topbar-icon">📍</span>
        <span className="topbar-title">Find Evan</span>
        <span className="topbar-subtitle">evan-huang.dev</span>
      </div>

      <div className="main">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="sidebar-scroll">

            {/* Hero — Evan */}
            <div
              className={`hero-card ${activePin === "evan" ? "hero-card--active" : ""}`}
              onClick={() => handlePinClick("evan")}
            >
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
            {activePin === "evan" && DETAIL.evan}

            <div className="sidebar-divider" />

            {/* Education */}
            <div className="section-label">Education</div>
            {PINS.filter((p) => p.id === "uow").map((pin) => (
              <PinRow key={pin.id} pin={pin} active={activePin === pin.id} onClick={() => handlePinClick(pin.id)} detail={DETAIL[pin.id]} />
            ))}

            <div className="sidebar-divider" />

            {/* Experience */}
            <div className="section-label">Experience</div>
            {PINS.filter((p) => p.id === "blackberry" || p.id === "compugen").map((pin) => (
              <PinRow key={pin.id} pin={pin} active={activePin === pin.id} onClick={() => handlePinClick(pin.id)} detail={DETAIL[pin.id]} />
            ))}

            <div className="sidebar-divider" />

            {/* Projects */}
            <div className="section-label">Projects</div>
            {PINS.filter((p) => p.id === "projects").map((pin) => (
              <PinRow key={pin.id} pin={pin} active={activePin === pin.id} onClick={() => handlePinClick(pin.id)} detail={DETAIL[pin.id]} />
            ))}

          </div>
          <VisitorFooter
            showPins={showVisitorPins}
            onToggle={setShowVisitorPins}
            onPinsLoaded={setVisitorPins}
          />
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
    </div>
  )
}

function PinAvatar({ pin, size = 36 }: { pin: Pin; size?: number }) {
  const [err, setErr] = useState(false)
  const isAnimated = pin.notFound

  if (isAnimated) {
    return (
      <div style={{
        width: size, height: size, borderRadius: "50%",
        background: "#8e8e93", border: "2px solid white",
        boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: size * 0.45, flexShrink: 0,
        position: "relative", overflow: "hidden",
      }}>
        <span style={{ filter: "brightness(0) invert(0.5)" }}>📁</span>
        <div style={{
          position: "absolute", inset: -2,
          borderRadius: "50%",
          border: `2.5px solid transparent`,
          borderTopColor: "#30b94d",
          borderRightColor: "#30b94d",
          animation: "spin 1s linear infinite",
        }} />
      </div>
    )
  }

  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      border: "2px solid white",
      boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
      overflow: "hidden", flexShrink: 0,
      background: pin.iconBg,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.45,
    }}>
      {!err ? (
        <img
          src={`/pins/${pin.id}.jpg`}
          alt={pin.label}
          onError={() => setErr(true)}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      ) : (
        <span>{pin.emoji}</span>
      )}
    </div>
  )
}

function PinRow({ pin, active, onClick, detail }: { pin: Pin; active: boolean; onClick: () => void; detail: React.ReactNode }) {
  return (
    <>
      <div className={`pin-card ${active ? "pin-card--active" : ""}`} onClick={onClick}>
        <PinAvatar pin={pin} size={38} />
        <div className="pin-card-body">
          <div className="pin-card-name">{pin.label}</div>
          <div className="pin-card-sub">
            {pin.notFound ? (
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#ff9500", display: "inline-block" }} />
                Location not found
              </span>
            ) : pin.sub}
          </div>
        </div>
        <span className="pin-chevron">›</span>
      </div>
      {active && detail}
    </>
  )
}
