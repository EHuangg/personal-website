"use client"

import { useEffect, useRef, useCallback } from "react"
import { siteConfig } from "@personal-website/shared"
import Link from "next/link"
import gsap from "gsap"

type Pt = [number, number]

const CX = 500, CY = 470

function H(s: number): number {
  const v = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return v - Math.floor(v)
}

function curvedPath(a: Pt, b: Pt, seed: number, bend: number): string {
  const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2
  const dx = b[0] - a[0], dy = b[1] - a[1]
  const len = Math.sqrt(dx * dx + dy * dy) || 1
  const nx = -dy / len, ny = dx / len
  const offset = (H(seed) - 0.5) * 2 * bend
  return `M${a[0]},${a[1]} Q${Math.round(mx + nx * offset)},${Math.round(my + ny * offset)} ${b[0]},${b[1]}`
}

function multiCurve(points: Pt[], seed: number, bend: number): string {
  let d = `M${points[0][0]},${points[0][1]}`
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1], cur = points[i]
    const mx = (prev[0] + cur[0]) / 2, my = (prev[1] + cur[1]) / 2
    const dx = cur[0] - prev[0], dy = cur[1] - prev[1]
    const len = Math.sqrt(dx * dx + dy * dy) || 1
    const nx = -dy / len, ny = dx / len
    const offset = (H(seed + i * 73) - 0.5) * 2 * bend
    d += ` Q${Math.round(mx + nx * offset)},${Math.round(my + ny * offset)} ${cur[0]},${cur[1]}`
  }
  return d
}

// ── 18 asymmetric radial spokes ──
const RADIALS: number[] = []
const baseAngles = [
  -92, -68, -50, -28, -8, 14, 38, 55, 78, 98,
  115, 138, 158, 178, 198, 225, 248, 270
]
for (const deg of baseAngles) {
  RADIALS.push((deg + (H(deg * 7 + 3) - 0.5) * 8) * Math.PI / 180)
}
const NR = RADIALS.length
const nx = (i: number) => (i + 1) % NR

// Ring point on a spoke at given base radius + jitter
function rp(baseR: number, spoke: number, jitter: number): Pt {
  const a = RADIALS[spoke]
  const r = baseR + (H(baseR * 3 + spoke * 17) - 0.5) * jitter
  return [Math.round(CX + Math.cos(a) * r), Math.round(CY + Math.sin(a) * r)]
}

// 4 main rings
const RING0 = Array.from({ length: NR }, (_, i) => rp(70, i, 18))
const RING1 = Array.from({ length: NR }, (_, i) => rp(150, i, 35))
const RING2 = Array.from({ length: NR }, (_, i) => rp(290, i, 55))
const RING3 = Array.from({ length: NR }, (_, i) => rp(460, i, 70))
const RINGS = [RING0, RING1, RING2, RING3]

// Edge points
function toEdge(pt: Pt): Pt {
  const dx = pt[0] - CX, dy = pt[1] - CY
  let tMin = 1e9
  const test = (t: number, c: number) => {
    if (t > 0.01 && c >= -1 && c <= 1001 && t < tMin) tMin = t
  }
  if (dx !== 0) { test(-CX / dx, CY + dy * (-CX / dx)); test((1000 - CX) / dx, CY + dy * ((1000 - CX) / dx)) }
  if (dy !== 0) { test(-CY / dy, CX + dx * (-CY / dy)); test((1000 - CY) / dy, CX + dx * ((1000 - CY) / dy)) }
  return [Math.round(Math.max(0, Math.min(1000, CX + dx * tMin))), Math.round(Math.max(0, Math.min(1000, CY + dy * tMin)))]
}
const EDGE = RING3.map(toEdge)

// ── Build crack paths ──
const CRACK_PATHS: { d: string; cls: string }[] = []

// 1) Main radial spokes
for (let i = 0; i < NR; i++) {
  const pts: Pt[] = [[CX, CY], RING0[i], RING1[i], RING2[i], RING3[i], EDGE[i]]
  CRACK_PATHS.push({ d: multiCurve(pts, i * 100, 14), cls: "crack-main" })
}

// 2) Concentric arcs — DISCONNECTED, each segment at its own radius
//    For each pair of adjacent spokes, generate short arc segments at
//    varying radii (not locked to ring positions)
const ARC_RADII = [60, 95, 130, 170, 210, 260, 320, 380, 440]
for (let ai = 0; ai < ARC_RADII.length; ai++) {
  const baseR = ARC_RADII[ai]
  for (let i = 0; i < NR; i++) {
    // Skip ~30-50% of segments randomly for disconnected look
    if (H(ai * 50 + i * 31 + 7) < 0.35) continue
    // Each segment gets its own radius offset
    const segR = baseR + (H(ai * 80 + i * 43) - 0.5) * 40
    const a1 = RADIALS[i], a2 = RADIALS[nx(i)]
    const p1: Pt = [Math.round(CX + Math.cos(a1) * segR), Math.round(CY + Math.sin(a1) * segR)]
    const p2: Pt = [Math.round(CX + Math.cos(a2) * segR), Math.round(CY + Math.sin(a2) * segR)]
    CRACK_PATHS.push({
      d: curvedPath(p1, p2, ai * 200 + i, 6 + ai * 2),
      cls: baseR < 200 ? "crack-ring-inner" : "crack-ring-outer"
    })
  }
}

// 3) Branch cracks
for (let r = 0; r < 4; r++) {
  const ring = RINGS[r]
  for (let i = 0; i < NR; i++) {
    const prob = r === 0 ? 0.7 : r === 1 ? 0.5 : r === 2 ? 0.35 : 0.2
    if (H(r * 300 + i * 41 + 7) > prob) continue
    const branchAngle = RADIALS[i] + (H(r * 400 + i * 53) - 0.5) * 1.8
    const len = 25 + H(r * 500 + i * 67) * (r === 0 ? 40 : 70)
    const start = ring[i]
    const end: Pt = [
      Math.round(start[0] + Math.cos(branchAngle) * len),
      Math.round(start[1] + Math.sin(branchAngle) * len),
    ]
    CRACK_PATHS.push({ d: curvedPath(start, end, r * 600 + i, 6 + r * 3), cls: "crack-branch" })
    if (H(r * 700 + i * 83) < 0.35) {
      const forkAngle = branchAngle + (H(r * 800 + i * 97) - 0.5) * 1.2
      const forkLen = 15 + H(r * 900 + i * 103) * 30
      const forkEnd: Pt = [
        Math.round(end[0] + Math.cos(forkAngle) * forkLen),
        Math.round(end[1] + Math.sin(forkAngle) * forkLen),
      ]
      CRACK_PATHS.push({ d: curvedPath(end, forkEnd, r * 1000 + i, 5), cls: "crack-fork" })
    }
  }
}

// 4) Extra radial spokes
const EXTRA_ANGLES = [-78, -35, 5, 42, 88, 128, 165, 215].map(
  (d, i) => (d + (H(i * 37 + 999) - 0.5) * 12) * Math.PI / 180
)
for (let i = 0; i < EXTRA_ANGLES.length; i++) {
  const a = EXTRA_ANGLES[i]
  const startR = 80 + H(i * 47 + 200) * 60
  const endR = 250 + H(i * 59 + 300) * 200
  const start: Pt = [Math.round(CX + Math.cos(a) * startR), Math.round(CY + Math.sin(a) * startR)]
  const mid: Pt = [
    Math.round(CX + Math.cos(a + (H(i * 71 + 400) - 0.5) * 0.15) * ((startR + endR) / 2)),
    Math.round(CY + Math.sin(a + (H(i * 71 + 400) - 0.5) * 0.15) * ((startR + endR) / 2)),
  ]
  const end: Pt = [Math.round(CX + Math.cos(a) * endR), Math.round(CY + Math.sin(a) * endR)]
  CRACK_PATHS.push({ d: multiCurve([start, mid, end], i * 150, 18), cls: "crack-extra" })
}

// 5) Micro-cracks near impact
for (let i = 0; i < 12; i++) {
  const a = (H(i * 23 + 500) * 2 - 1) * Math.PI
  const r1 = 15 + H(i * 29 + 600) * 30
  const r2 = 50 + H(i * 31 + 700) * 40
  const s: Pt = [Math.round(CX + Math.cos(a) * r1), Math.round(CY + Math.sin(a) * r1)]
  const e: Pt = [Math.round(CX + Math.cos(a + (H(i * 37 + 800) - 0.5) * 0.5) * r2),
    Math.round(CY + Math.sin(a + (H(i * 37 + 800) - 0.5) * 0.5) * r2)]
  CRACK_PATHS.push({ d: curvedPath(s, e, i * 170, 5), cls: "crack-micro" })
}

// ── Shard polygons ──
// Inner shards: center → RING2 triangles
const INNER_SHARDS = Array.from({ length: NR }, (_, i) => {
  const j = nx(i)
  return [[CX, CY] as Pt, RING2[i], RING2[j]]
})

// Outer shards: RING2 → RING3 → edge
const VP_CORNERS: Pt[] = [[0, 0], [1000, 0], [1000, 1000], [0, 1000]]
function vpSide(p: Pt): number {
  if (p[1] <= 0) return 0; if (p[0] >= 1000) return 1; if (p[1] >= 1000) return 2; return 3
}
function corners(a: Pt, b: Pt): Pt[] {
  const sa = vpSide(a), sb = vpSide(b)
  const r: Pt[] = []
  let s = sa
  while (s !== sb) { r.push(VP_CORNERS[(s + 1) % 4]); s = (s + 1) % 4 }
  return r
}
const OUTER_SHARDS = Array.from({ length: NR }, (_, i) => {
  const j = nx(i)
  return [RING2[i], RING3[i], EDGE[i], ...corners(EDGE[i], EDGE[j]), EDGE[j], RING3[j], RING2[j]]
})

function shade(i: number, base: number): string {
  const v = Math.round((base + H(i * 17 + 33) * 0.025) * 255)
  return `rgb(${v},${v},${v})`
}

// ── Nav buttons = actual crack-formed shards (quads between 2 spokes × 2 rings) ──
// tiles: array of {spokeI, ringR} — multiple tiles share one link
// Scattered across ring levels for visual variety
type NavItem = {
  tiles: { spokeI: number; ringR: number }[]
  label: string; href: string; rot: number; external?: boolean; icon?: string
}
const NAV_ITEMS: NavItem[] = [
  { tiles: [{ spokeI: 2, ringR: 3 }],  label: "ABOUT",      href: "/about",      rot: -5  },
  { tiles: [{ spokeI: 14, ringR: 2 }], label: "PROJECTS",   href: "/projects",   rot: 8   },
  { tiles: [{ spokeI: 15, ringR: 2 }], label: "EXPERIENCE", href: "/experience", rot: -4  },
  { tiles: [{ spokeI: 5, ringR: 2 }],  label: "PIXEL ART",  href: "/pixel-art",  rot: -9  },
  // CTA links — right side, outermost ring band
  { tiles: [{ spokeI: 6, ringR: 3 }],  label: "LINKEDIN", href: siteConfig.links.linkedin, rot: 3,  external: true, icon: "/icons/linkedin_logo.png" },
  { tiles: [{ spokeI: 7, ringR: 3 }], label: "GITHUB",   href: siteConfig.links.github,   rot: -6, external: true },
  { tiles: [{ spokeI: 8, ringR: 3 }], label: "RESUME",   href: siteConfig.links.resume,   rot: 5,  external: true },
]

// ── Map tile: full outer shard wedge (spoke 10, left side, RING2 → edge) ──
const MAP_SHARD_SPOKE = 10

const RING_ARRAYS = [RING0, RING1, RING2, RING3, EDGE]
function makeShard(spokeI: number, ringR: number): Pt[] {
  const j = nx(spokeI)
  return [RING_ARRAYS[ringR][spokeI], RING_ARRAYS[ringR + 1][spokeI], RING_ARRAYS[ringR + 1][j], RING_ARRAYS[ringR][j]]
}

const MAP_SHARDS = [OUTER_SHARDS[MAP_SHARD_SPOKE]]

// Shard centroid in SVG coords (0-1000) → percentage offset from page center
const MAP_SHARD_CENTROID: Pt = (() => {
  const pts = MAP_SHARDS[0]
  const n = pts.length
  return [
    Math.round(pts.reduce((s, v) => s + v[0], 0) / n),
    Math.round(pts.reduce((s, v) => s + v[1], 0) / n),
  ] as Pt
})()
// Offset from page center in percentage (-50 to +50 range)
const MAP_CENTER_OFFSET: Pt = [
  (MAP_SHARD_CENTROID[0] - 500) / 10, // % of viewport width
  (MAP_SHARD_CENTROID[1] - 500) / 10, // % of viewport height
]

// CSS mask data URI — white polygons on transparent bg
const MAP_MASK_SVG = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1000 1000' preserveAspectRatio='none'>${MAP_SHARDS.map(p => `<polygon points='${p.map(v => v.join(",")).join(" ")}' fill='white'/>`).join("")}</svg>`
const MAP_MASK = `url("data:image/svg+xml,${encodeURIComponent(MAP_MASK_SVG)}")`

// Mapbox loader
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? ""
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
      link.id = "mb-css"; link.rel = "stylesheet"
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

// Flatten: for each nav item, generate all tile shards
// Track which flat index maps to which nav item
const NAV_FLAT: { navIdx: number; shard: Pt[] }[] = []
for (let ni = 0; ni < NAV_ITEMS.length; ni++) {
  for (const t of NAV_ITEMS[ni].tiles) {
    NAV_FLAT.push({ navIdx: ni, shard: makeShard(t.spokeI, t.ringR) })
  }
}
// For each nav item, compute a bounding box centroid across all its tiles
const NAV_CENTROIDS: Pt[] = NAV_ITEMS.map((item, ni) => {
  const tiles = NAV_FLAT.filter(f => f.navIdx === ni)
  const allPts = tiles.flatMap(t => t.shard)
  const n = allPts.length
  return [Math.round(allPts.reduce((s, v) => s + v[0], 0) / n), Math.round(allPts.reduce((s, v) => s + v[1], 0) / n)]
})

function svgPts(p: Pt[]): string { return p.map(v => v.join(",")).join(" ") }
function cssClip(p: Pt[]): string { return `polygon(${p.map(([x, y]) => `${x / 10}% ${y / 10}%`).join(", ")})` }
function centroid(p: Pt[]): Pt {
  const n = p.length
  return [Math.round(p.reduce((s, v) => s + v[0], 0) / n), Math.round(p.reduce((s, v) => s + v[1], 0) / n)]
}

export default function Home() {
  const ref = useRef<HTMLDivElement>(null)
  const navEls = useRef<(SVGPolygonElement | null)[]>([])
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<MapboxMap | null>(null)
  const mapShardEl = useRef<SVGPolygonElement | null>(null)
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(".shard-poly",
        { opacity: 0 },
        { opacity: 1, duration: 0.4, stagger: { each: 0.012, from: "random" }, ease: "power2.out", delay: 0.05 }
      )
      gsap.fromTo(".crack-path",
        { strokeDashoffset: 800 },
        { strokeDashoffset: 0, duration: 1, stagger: { each: 0.008, from: "random" }, ease: "power2.out", delay: 0.1 }
      )
      gsap.fromTo(".nav-label",
        { opacity: 0, scale: 2 },
        { opacity: 1, scale: 1, duration: 0.3, stagger: 0.08, ease: "back.out(2)", delay: 0.5 }
      )
      gsap.fromTo(".hero-center",
        { opacity: 0, scale: 0.85 },
        { opacity: 1, scale: 1, duration: 0.9, ease: "power4.out", delay: 0.35 }
      )

    }, ref)
    return () => ctx.revert()
  }, [])

  // Initialize Mapbox map
  useEffect(() => {
    if (!MAPBOX_TOKEN || !mapContainerRef.current) return
    let cancelled = false
    loadMapbox().then(() => {
      if (cancelled || mapRef.current || !mapContainerRef.current || !window.mapboxgl) return
      window.mapboxgl.accessToken = MAPBOX_TOKEN
      // Compute pixel offset so map center aligns with tile centroid
      const el = mapContainerRef.current
      const offsetX = Math.round(MAP_CENTER_OFFSET[0] / 100 * el.clientWidth)
      const offsetY = Math.round(MAP_CENTER_OFFSET[1] / 100 * el.clientHeight)
      const map = new window.mapboxgl.Map({
        container: mapContainerRef.current,
        style: "mapbox://styles/mapbox/dark-v11",
        center: [-79.55, 43.65],
        zoom: 9.2,
        projection: "mercator" as unknown as undefined,
        interactive: true,
        attributionControl: false,
      })
      // Shift the map so Toronto appears at the tile centroid
      map.on("load", () => {
        if (!cancelled) {
          map.panBy([offsetX, offsetY], { animate: false } as Record<string, unknown>)
          map.resize()
          mapRef.current = map
        }
      })
      const ro = new ResizeObserver(() => map.resize())
      ro.observe(mapContainerRef.current!)
    })
    return () => { cancelled = true; mapRef.current?.remove(); mapRef.current = null }
  }, [])

  // Store original paint colors so we can restore on leave
  const origColors = useRef<Map<string, { prop: string; val: unknown }>>(new Map())

  const setMapRed = useCallback((red: boolean) => {
    const map = mapRef.current
    if (!map) return
    const style = map.getStyle()
    if (!style?.layers) return
    for (const layer of style.layers) {
      const l = layer as unknown as Record<string, Record<string, unknown>>
      const id = layer.id
      const t = layer.type

      // Determine which paint properties to change
      const changes: { prop: string; redVal: string }[] = []

      if (t === "background") {
        changes.push({ prop: "background-color", redVal: "#120a0a" })
      } else if (t === "fill") {
        if (id.includes("water") || id.includes("ocean")) {
          changes.push({ prop: "fill-color", redVal: "#1a0e0e" })
        } else {
          changes.push({ prop: "fill-color", redVal: "#241414" })
        }
      } else if (t === "line") {
        if (id.includes("road")) {
          changes.push({ prop: "line-color", redVal: "#5c2020" })
        } else if (id.includes("water") || id.includes("ocean")) {
          changes.push({ prop: "line-color", redVal: "#1a0e0e" })
        } else {
          changes.push({ prop: "line-color", redVal: "#3a1515" })
        }
      } else if (t === "symbol") {
        // Keep text labels white
        changes.push({ prop: "text-color", redVal: "#ffffff" })
        changes.push({ prop: "text-halo-color", redVal: "rgba(0,0,0,0.8)" })
      } else if (t === "fill-extrusion") {
        changes.push({ prop: "fill-extrusion-color", redVal: "#2a1010" })
      }

      if (changes.length === 0) continue

      for (const { prop, redVal } of changes) {
        const key = `${id}::${prop}`
        if (red) {
          if (!origColors.current.has(key)) {
            origColors.current.set(key, { prop, val: l.paint?.[prop] ?? null })
          }
          try { map.setPaintProperty(id, prop, redVal) } catch {}
        } else {
          const orig = origColors.current.get(key)
          if (orig?.val != null) {
            try { map.setPaintProperty(id, orig.prop, orig.val) } catch {}
          }
        }
      }
    }
  }, [])

  // Map tile hover — red filter on canvas + border shake
  const onMapEnter = useCallback(() => {
    mapContainerRef.current?.parentElement?.classList.add("map-hovered")
    setMapRed(true)
    const el = mapShardEl.current
    if (!el) return
    el.classList.add("is-hovered")
    gsap.to(el, {
      keyframes: [
        { x: -2, y: 1, rotation: -0.4, duration: 0.06 },
        { x: 2, y: -1, rotation: 0.4, duration: 0.06 },
        { x: -1, y: 0, rotation: -0.2, duration: 0.06 },
        { x: 1, y: 1, rotation: 0.2, duration: 0.06 },
        { x: 0, y: 0, rotation: 0, duration: 0.06 },
      ],
      repeat: -1, ease: "none",
    })
  }, [setMapRed])
  const onMapLeave = useCallback(() => {
    mapContainerRef.current?.parentElement?.classList.remove("map-hovered")
    setMapRed(false)
    const el = mapShardEl.current
    if (!el) return
    el.classList.remove("is-hovered")
    gsap.killTweensOf(el)
    gsap.to(el, { x: 0, y: 0, rotation: 0, duration: 0.15 })
  }, [setMapRed])

  // Hover handlers — activate ALL tiles belonging to the same nav item
  const onEnter = useCallback((navIdx: number) => {
    NAV_FLAT.forEach((f, fi) => {
      if (f.navIdx !== navIdx) return
      const el = navEls.current[fi]
      if (!el) return
      el.classList.add("is-hovered")
      gsap.to(el, {
        keyframes: [
          { x: -2, y: 1, rotation: -0.4, duration: 0.06 },
          { x: 2, y: -1, rotation: 0.4, duration: 0.06 },
          { x: -1, y: 0, rotation: -0.2, duration: 0.06 },
          { x: 1, y: 1, rotation: 0.2, duration: 0.06 },
          { x: 0, y: 0, rotation: 0, duration: 0.06 },
        ],
        repeat: -1, ease: "none",
      })
    })
  }, [])
  const onLeave = useCallback((navIdx: number) => {
    NAV_FLAT.forEach((f, fi) => {
      if (f.navIdx !== navIdx) return
      const el = navEls.current[fi]
      if (!el) return
      el.classList.remove("is-hovered")
      gsap.killTweensOf(el)
      gsap.to(el, { x: 0, y: 0, rotation: 0, duration: 0.15 })
    })
  }, [])

  return (
    <div ref={ref} className="home-landing">
      <svg className="shatter-svg" viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-hidden="true">
        {INNER_SHARDS.map((p, i) => (
          <polygon key={`is-${i}`} className="shard-poly shard-inner"
            points={svgPts(p)} style={{ "--shard-fill": shade(i, 0.015) } as React.CSSProperties} />
        ))}
        {OUTER_SHARDS.map((p, i) => (
          <polygon key={`os-${i}`} className="shard-poly shard-outer"
            points={svgPts(p)} style={{ "--shard-fill": shade(i + 50, 0.032) } as React.CSSProperties} />
        ))}
        {/* Map shard border */}
        {/* Nav shards — all tiles for all nav items */}
        {NAV_FLAT.map(({ shard }, fi) => (
          <polygon key={`ns-${fi}`} ref={el => { navEls.current[fi] = el }}
            className="shard-poly shard-nav"
            points={svgPts(shard)}
            style={{ "--shard-fill": "#0a0a0a" } as React.CSSProperties} />
        ))}
        {CRACK_PATHS.map(({ d, cls }, i) => (
          <path key={`cp-${i}`} className={`crack-path ${cls}`} d={d} fill="none" />
        ))}
      </svg>

      {/* Mapbox map masked to shard shape */}
      <div className="map-shard-layer" style={{
        WebkitMaskImage: MAP_MASK, maskImage: MAP_MASK,
        WebkitMaskSize: "100% 100%", maskSize: "100% 100%",
        WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat",
        clipPath: cssClip(MAP_SHARDS[0]),
      }}
        onMouseEnter={onMapEnter}
        onMouseLeave={onMapLeave}
      >
        <div ref={mapContainerRef} className="map-shard-canvas" />
      </div>

      {/* Map shard border (SVG above the map) */}
      <svg className="map-border-svg" viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-hidden="true">
        <polygon ref={mapShardEl} className="shard-poly shard-map"
          points={svgPts(MAP_SHARDS[0])}
          style={{ "--shard-fill": "transparent" } as React.CSSProperties} />
      </svg>

      <div className="nav-overlay-layer">
        {NAV_ITEMS.map(({ href, label, rot, external, icon }, ni) => {
          const [cx, cy] = NAV_CENTROIDS[ni]
          const tiles = NAV_FLAT.filter(f => f.navIdx === ni)
          const labelEl = (
            <span className="nav-label" style={{
              left: `${cx / 10}%`, top: `${cy / 10}%`,
              transform: `translate(-50%, -50%) rotate(${rot}deg)`,
            }}>{icon && <img src={icon} alt="" className="nav-label-icon" />}{label}</span>
          )
          const handlers = {
            onMouseEnter: () => onEnter(ni),
            onMouseLeave: () => onLeave(ni),
          }
          // Render one overlay link per tile so each tile is clickable
          return tiles.map((t, ti) => {
            const k = `${href}-${ti}`
            const sharedProps = {
              className: "nav-overlay-link",
              style: { clipPath: cssClip(t.shard) },
              ...handlers,
            }
            return external ? (
              <a key={k} {...sharedProps} href={href}
                {...(label === "RESUME" ? { download: true } : { target: "_blank", rel: "noopener noreferrer" })}
              >{ti === 0 ? labelEl : null}</a>
            ) : (
              <Link key={k} {...sharedProps} href={href}>{ti === 0 ? labelEl : null}</Link>
            )
          })
        })}
      </div>

      <div className="hero-center">
        <div className="hero-photo">
          <img src="/pins/evan.jpg" alt="Evan Huang" />
        </div>
        <div className="hero-name-row">
          <div className="hero-name">
            <div className="hero-row">
              <span className="hero-greeting">
                <span>Hi!</span>
                <span>I&apos;m</span>
              </span>
              <span className="hero-name-first">EVAN</span>
            </div>
            <div className="hero-row">
              <span className="hero-name-last">HUANG</span>
            </div>
          </div>
          <p className="hero-bio">
            I&apos;m a Canadian full stack dev based in Toronto,
            outside of tech I also like basketball, soccer and art.
          </p>
        </div>
      </div>


    </div>
  )
}
