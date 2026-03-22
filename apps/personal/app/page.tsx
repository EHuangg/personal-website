"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { siteConfig } from "@personal-website/shared"

// ── Pin data ──────────────────────────────────────────────────────────────────

type PinId = "evan" | "uow" | "blackberry" | "compugen" | "projects"

type Pin = {
  id: PinId
  label: string
  sub: string
  icon: string
  iconBg: string
  lng: number
  lat: number
  zoom: number
  notFound?: boolean
}

const PINS: Pin[] = [
  {
    id: "evan",
    label: "Evan Huang",
    sub: "Oakville, ON",
    icon: "🏠",
    iconBg: "#0a84ff",
    lng: -79.6877,
    lat: 43.4675,
    zoom: 13,
  },
  {
    id: "uow",
    label: "University of Waterloo",
    sub: "Waterloo, ON · B.Sc Mathematics",
    icon: "🎓",
    iconBg: "#ff9500",
    lng: -80.5449,
    lat: 43.4723,
    zoom: 15,
  },
  {
    id: "blackberry",
    label: "BlackBerry",
    sub: "Waterloo, ON · Network Engineer Intern",
    icon: "💼",
    iconBg: "#30b94d",
    lng: -80.5204,
    lat: 43.4516,
    zoom: 15,
  },
  {
    id: "compugen",
    label: "Compugen Inc.",
    sub: "Richmond Hill, ON · Network Ops Intern",
    icon: "💼",
    iconBg: "#30b94d",
    lng: -79.4341,
    lat: 43.8828,
    zoom: 14,
  },
  {
    id: "projects",
    label: "Projects",
    sub: "Location not found",
    icon: "📁",
    iconBg: "#bf5af2",
    lng: -79.3832,
    lat: 43.6532,
    zoom: 12,
    notFound: true,
  },
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
      Marker: new (opts?: object) => MapboxMarker
      Popup: new (opts?: object) => MapboxPopup
      NavigationControl: new (opts?: object) => object
    }
  }
}

type MapboxMap = {
  flyTo: (opts: object) => void
  addControl: (control: object, position?: string) => void
  remove: () => void
  on: (event: string, cb: () => void) => void
}
type MapboxMarker = {
  setLngLat: (coords: [number, number]) => MapboxMarker
  setPopup: (popup: MapboxPopup) => MapboxMarker
  addTo: (map: MapboxMap) => MapboxMarker
  getElement: () => HTMLElement
  remove: () => void
}
type MapboxPopup = {
  setHTML: (html: string) => MapboxPopup
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

function makeMarkerEl(pin: Pin, active: boolean): HTMLElement {
  const el = document.createElement("div")
  el.style.cssText = `
    width: 36px; height: 36px; border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg); background: ${pin.iconBg};
    border: 2px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.25);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; transition: transform 0.2s, box-shadow 0.2s;
    ${active ? "transform: rotate(-45deg) scale(1.2); box-shadow: 0 4px 16px rgba(0,0,0,0.35);" : ""}
  `
  const inner = document.createElement("div")
  inner.style.cssText = "transform: rotate(45deg); font-size: 16px; line-height: 1;"
  inner.textContent = pin.icon
  el.appendChild(inner)
  return el
}

// ── Main component ────────────────────────────────────────────────────────────

export default function FindEvan() {
  const mapRef = useRef<MapboxMap | null>(null)
  const markersRef = useRef<Map<PinId, MapboxMarker>>(new Map())
  const [activePin, setActivePin] = useState<PinId | null>(null)
  const [mapReady, setMapReady] = useState(false)

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
        // Add markers
        PINS.forEach((pin) => {
          const el = makeMarkerEl(pin, false)
          const popup = new window.mapboxgl.Popup({ offset: 25, closeButton: false })
            .setHTML(`<strong style="font-size:0.82rem">${pin.label}</strong><br><span style="color:#9a8a72;font-size:0.7rem">${pin.sub}</span>`)

          const marker = new window.mapboxgl.Marker({ element: el })
            .setLngLat([pin.lng, pin.lat])
            .setPopup(popup)
            .addTo(map)

          el.addEventListener("click", () => handlePinClick(pin.id))
          markersRef.current.set(pin.id, marker)
        })

        mapRef.current = map
        setMapReady(true)
      })
    })

    return () => {
      cancelled = true
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [])

  const handlePinClick = useCallback((id: PinId) => {
    setActivePin((prev) => {
      const next = prev === id ? null : id
      if (next) {
        const pin = PINS.find((p) => p.id === next)!
        mapRef.current?.flyTo({ center: [pin.lng, pin.lat], zoom: pin.zoom, duration: 1200, essential: true })
        // Update marker scales
        markersRef.current.forEach((marker, pid) => {
          const el = marker.getElement()
          el.style.transform = pid === next
            ? "rotate(-45deg) scale(1.25)"
            : "rotate(-45deg) scale(1)"
          el.style.boxShadow = pid === next
            ? "0 4px 16px rgba(0,0,0,0.35)"
            : "0 2px 8px rgba(0,0,0,0.25)"
        })
      } else {
        markersRef.current.forEach((marker) => {
          marker.getElement().style.transform = "rotate(-45deg) scale(1)"
        })
      }
      return next
    })
  }, [])

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
                <div className="hero-avatar">EH</div>
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
        </aside>

        {/* Map */}
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

function PinRow({ pin, active, onClick, detail }: { pin: Pin; active: boolean; onClick: () => void; detail: React.ReactNode }) {
  return (
    <>
      <div className={`pin-card ${active ? "pin-card--active" : ""}`} onClick={onClick}>
        <div className="pin-icon" style={{ background: pin.iconBg + "22" }}>
          {pin.notFound ? (
            <span style={{ fontSize: 14 }}>🔍</span>
          ) : (
            <span>{pin.icon}</span>
          )}
        </div>
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
