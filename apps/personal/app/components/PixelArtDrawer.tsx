"use client"

import { useRef, useState, useCallback, useEffect } from "react"

const SIZE = 16
const BASE_CELL = 20

const PALETTE = [
  "#000000", "#ffffff", "#ff3b30", "#ff9500", "#ffcc00",
  "#30b94d", "#0a84ff", "#bf5af2", "#ff2d55", "#8e8e93",
  "#5ac8fa", "#ff6b35", "#2a2318", "#c8b89a", "#6a5a42", "#f5f0e8",
]

export default function PixelArtDrawer({ onSubmit, onCancel, initialArt }: {
  onSubmit: (dataUrl: string) => void
  onCancel: () => void
  initialArt?: string
}) {
  const [grid, setGrid] = useState<string[][]>(() => {
    if (initialArt) {
      // Decode existing art into grid
      const img = new Image()
      img.src = initialArt
      // Will be populated via useEffect below
    }
    return Array.from({ length: SIZE }, () => Array(SIZE).fill(""))
  })
  const [color, setColor] = useState("#0a84ff")
  const [erasing, setErasing] = useState(false)
  const [drawing, setDrawing] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [cellSize, setCellSize] = useState(BASE_CELL)
  const [sheetOffsetY, setSheetOffsetY] = useState(0)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sheetStartYRef = useRef<number | null>(null)
  const sheetDraggingRef = useRef(false)
  const sheetCanDragRef = useRef(false)
  const sheetOffsetRef = useRef(0)
  const sheetScrollRef = useRef<HTMLDivElement | null>(null)

  // Load initial art into grid if editing
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)")
    const sync = () => setIsMobile(mq.matches)
    sync()
    mq.addEventListener("change", sync)
    return () => mq.removeEventListener("change", sync)
  }, [])

  useEffect(() => {
    setSheetOffsetY(0)
    sheetStartYRef.current = null
    sheetDraggingRef.current = false
    sheetCanDragRef.current = false
    sheetOffsetRef.current = 0
  }, [isMobile])

  useEffect(() => {
    if (!isMobile) {
      setCellSize(BASE_CELL)
      return
    }

    const recalc = () => {
      const vh = window.innerHeight
      const reservedHeight = 255
      const fit = Math.floor(((vh * 0.96) - reservedHeight) / SIZE)
      const next = Math.max(14, Math.min(BASE_CELL, fit))
      setCellSize(next)
    }

    recalc()
    window.addEventListener("resize", recalc)
    return () => window.removeEventListener("resize", recalc)
  }, [isMobile])

  useEffect(() => {
    if (!initialArt) return
    const img = new Image()
    img.onload = () => {
      const c = document.createElement("canvas")
      c.width = SIZE; c.height = SIZE
      const ctx = c.getContext("2d")!
      ctx.drawImage(img, 0, 0, SIZE, SIZE)
      const newGrid = Array.from({ length: SIZE }, (_, y) =>
        Array.from({ length: SIZE }, (_, x) => {
          const d = ctx.getImageData(x, y, 1, 1).data
          if (d[3] === 0) return ""
          return `#${[d[0], d[1], d[2]].map((v) => v.toString(16).padStart(2, "0")).join("")}`
        })
      )
      setGrid(newGrid)
    }
    img.src = initialArt
  }, [initialArt])

  // Draw grid to canvas
  useEffect(() => {
    const c = canvasRef.current
    if (!c) return
    const ctx = c.getContext("2d")!
    ctx.clearRect(0, 0, c.width, c.height)

    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const cell = grid[y][x]
        // Checkerboard bg for empty cells
        if (!cell) {
          ctx.fillStyle = (x + y) % 2 === 0 ? "#e8e0d4" : "#d8d0c4"
        } else {
          ctx.fillStyle = cell
        }
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize)
        // Grid line
        ctx.strokeStyle = "rgba(0,0,0,0.06)"
        ctx.lineWidth = 0.5
        ctx.strokeRect(x * cellSize, y * cellSize, cellSize, cellSize)
      }
    }
  }, [grid, cellSize])

  const paint = useCallback((ex: number, ey: number) => {
    const c = canvasRef.current!
    const rect = c.getBoundingClientRect()
    const x = Math.floor((ex - rect.left) / cellSize)
    const y = Math.floor((ey - rect.top) / cellSize)
    if (x < 0 || x >= SIZE || y < 0 || y >= SIZE) return
    setGrid((prev) => {
      const next = prev.map((r) => [...r])
      next[y][x] = erasing ? "" : color
      return next
    })
  }, [color, erasing, cellSize])

  const toDataUrl = () => {
    const c = document.createElement("canvas")
    c.width = SIZE; c.height = SIZE
    const ctx = c.getContext("2d")!
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        ctx.fillStyle = grid[y][x] || "transparent"
        ctx.fillRect(x, y, 1, 1)
      }
    }
    return c.toDataURL("image/png")
  }

  const clear = () => setGrid(Array.from({ length: SIZE }, () => Array(SIZE).fill("")))

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

    if (sheetOffsetRef.current > 120) {
      onCancel()
      return
    }

    setSheetOffsetY(0)
    sheetOffsetRef.current = 0
  }, [onCancel])

  const content = (
    <>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: isMobile ? "0.75rem" : "1rem" }}>
        <div>
          <div style={{ fontSize: "0.88rem", fontWeight: 600, color: "#2a2318" }}>Leave your mark</div>
          <div style={{ fontSize: "0.65rem", color: "#9a8a72", marginTop: 2 }}>draw a 16×16 pixel art pin</div>
        </div>
        <button onClick={onCancel} style={{ background: "none", border: "none", fontSize: "1.1rem", cursor: "pointer", color: "#9a8a72" }}>✕</button>
      </div>

      {/* Canvas */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: isMobile ? "0.55rem" : "0.75rem" }}>
        <canvas
          ref={canvasRef}
          width={SIZE * cellSize}
          height={SIZE * cellSize}
          style={{
            borderRadius: 6,
            border: "1px solid #c8b89a",
            cursor: erasing ? "cell" : "crosshair",
            imageRendering: "pixelated",
            touchAction: "none",
          }}
          onMouseDown={(e) => { setDrawing(true); paint(e.clientX, e.clientY) }}
          onMouseMove={(e) => { if (drawing) paint(e.clientX, e.clientY) }}
          onMouseUp={() => setDrawing(false)}
          onMouseLeave={() => setDrawing(false)}
          onTouchStart={(e) => {
            e.preventDefault()
            setDrawing(true)
            const t = e.touches[0]
            paint(t.clientX, t.clientY)
          }}
          onTouchMove={(e) => {
            e.preventDefault()
            if (!drawing) return
            const t = e.touches[0]
            paint(t.clientX, t.clientY)
          }}
          onTouchEnd={() => setDrawing(false)}
          onTouchCancel={() => setDrawing(false)}
        />
      </div>

      {/* Palette */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: isMobile ? "0.45rem" : "0.6rem", justifyContent: "center" }}>
        {PALETTE.map((c) => (
          <button
            key={c}
            onClick={() => { setColor(c); setErasing(false) }}
            style={{
              width: isMobile ? 20 : 22, height: isMobile ? 20 : 22, borderRadius: 4,
              background: c,
              border: color === c && !erasing ? "2px solid #2a2318" : "1.5px solid rgba(0,0,0,0.15)",
              cursor: "pointer",
              boxShadow: color === c && !erasing ? "0 0 0 1px #f5f0e8 inset" : "none",
            }}
          />
        ))}
      </div>

      {/* Controls */}
      <div style={{ display: "flex", gap: 6, marginBottom: isMobile ? "0.6rem" : "0.75rem", justifyContent: "center" }}>
        <button
          onClick={() => setErasing((e) => !e)}
          style={{
            padding: "4px 10px", borderRadius: 6, fontSize: "0.72rem",
            background: erasing ? "#2a2318" : "transparent",
            color: erasing ? "#f5f0e8" : "#6a5a42",
            border: "1px solid #c8b89a", cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          ✕ erase
        </button>
        <button
          onClick={clear}
          style={{
            padding: "4px 10px", borderRadius: 6, fontSize: "0.72rem",
            background: "transparent", color: "#6a5a42",
            border: "1px solid #c8b89a", cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          clear
        </button>
      </div>

      {/* Submit */}
      <button
        onClick={() => onSubmit(toDataUrl())}
        style={{
          width: "100%", padding: "0.6rem",
          background: "#0a84ff", color: "white",
          border: "none", borderRadius: 8,
          fontSize: "0.82rem", fontWeight: 600,
          cursor: "pointer", fontFamily: "inherit",
          letterSpacing: "0.02em",
        }}
      >
        Pin it →
      </button>
    </>
  )

  if (isMobile) {
    return (
      <>
        <div className="mobile-detail-backdrop" onClick={onCancel} style={{ zIndex: 1000 }} />
        <div
          className={`mobile-detail-sheet mobile-detail-sheet--drawer ${sheetDraggingRef.current ? "dragging" : ""}`}
          style={{ transform: `translateY(${sheetOffsetY}px)`, zIndex: 1001 }}
          onTouchStart={handleSheetTouchStart}
          onTouchMove={handleSheetTouchMove}
          onTouchEnd={handleSheetTouchEnd}
          onTouchCancel={handleSheetTouchEnd}
        >
          <div className="mobile-detail-grabber" />
          <div className="sidebar-scroll" ref={sheetScrollRef} style={{ padding: "0.15rem 0.9rem calc(0.8rem + env(safe-area-inset-bottom, 0))" }}>
            {content}
          </div>
        </div>
      </>
    )
  }

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(0,0,0,0.5)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }} onClick={(e) => { if (e.target === e.currentTarget) onCancel() }}>
      <div style={{
        background: "#f5f0e8",
        borderRadius: 16,
        padding: "1.25rem",
        width: "min(380px, 92vw)",
        maxHeight: "90vh",
        overflowY: "auto",
        boxShadow: "0 8px 40px rgba(0,0,0,0.25)",
        fontFamily: "'IBM Plex Mono', monospace",
      }}>
        {content}
      </div>
    </div>
  )
}
