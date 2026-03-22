"use client"

import { useRef, useState, useCallback, useEffect } from "react"

const SIZE = 16
const CELL = 20

const PALETTE = [
  "#000000", "#ffffff", "#ff3b30", "#ff9500", "#ffcc00",
  "#30b94d", "#0a84ff", "#bf5af2", "#ff2d55", "#8e8e93",
  "#5ac8fa", "#ff6b35", "#2a2318", "#c8b89a", "#6a5a42", "#f5f0e8",
]

export default function PixelArtDrawer({ onSubmit, onCancel }: {
  onSubmit: (dataUrl: string) => void
  onCancel: () => void
}) {
  const [grid, setGrid] = useState<string[][]>(() =>
    Array.from({ length: SIZE }, () => Array(SIZE).fill(""))
  )
  const [color, setColor] = useState("#0a84ff")
  const [erasing, setErasing] = useState(false)
  const [drawing, setDrawing] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

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
        ctx.fillRect(x * CELL, y * CELL, CELL, CELL)
        // Grid line
        ctx.strokeStyle = "rgba(0,0,0,0.06)"
        ctx.lineWidth = 0.5
        ctx.strokeRect(x * CELL, y * CELL, CELL, CELL)
      }
    }
  }, [grid])

  const paint = useCallback((ex: number, ey: number) => {
    const c = canvasRef.current!
    const rect = c.getBoundingClientRect()
    const x = Math.floor((ex - rect.left) / CELL)
    const y = Math.floor((ey - rect.top) / CELL)
    if (x < 0 || x >= SIZE || y < 0 || y >= SIZE) return
    setGrid((prev) => {
      const next = prev.map((r) => [...r])
      next[y][x] = erasing ? "" : color
      return next
    })
  }, [color, erasing])

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
        width: 380,
        boxShadow: "0 8px 40px rgba(0,0,0,0.25)",
        fontFamily: "'IBM Plex Mono', monospace",
      }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <div>
            <div style={{ fontSize: "0.88rem", fontWeight: 600, color: "#2a2318" }}>Leave your mark</div>
            <div style={{ fontSize: "0.65rem", color: "#9a8a72", marginTop: 2 }}>draw a 16×16 pixel art pin</div>
          </div>
          <button onClick={onCancel} style={{ background: "none", border: "none", fontSize: "1.1rem", cursor: "pointer", color: "#9a8a72" }}>✕</button>
        </div>

        {/* Canvas */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "0.75rem" }}>
          <canvas
            ref={canvasRef}
            width={SIZE * CELL}
            height={SIZE * CELL}
            style={{
              borderRadius: 6,
              border: "1px solid #c8b89a",
              cursor: erasing ? "cell" : "crosshair",
              imageRendering: "pixelated",
            }}
            onMouseDown={(e) => { setDrawing(true); paint(e.clientX, e.clientY) }}
            onMouseMove={(e) => { if (drawing) paint(e.clientX, e.clientY) }}
            onMouseUp={() => setDrawing(false)}
            onMouseLeave={() => setDrawing(false)}
            onTouchStart={(e) => {
              setDrawing(true)
              const t = e.touches[0]
              paint(t.clientX, t.clientY)
            }}
            onTouchMove={(e) => {
              const t = e.touches[0]
              paint(t.clientX, t.clientY)
            }}
            onTouchEnd={() => setDrawing(false)}
          />
        </div>

        {/* Palette */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: "0.6rem", justifyContent: "center" }}>
          {PALETTE.map((c) => (
            <button
              key={c}
              onClick={() => { setColor(c); setErasing(false) }}
              style={{
                width: 22, height: 22, borderRadius: 4,
                background: c,
                border: color === c && !erasing ? "2px solid #2a2318" : "1.5px solid rgba(0,0,0,0.15)",
                cursor: "pointer",
                boxShadow: color === c && !erasing ? "0 0 0 1px #f5f0e8 inset" : "none",
              }}
            />
          ))}
        </div>

        {/* Controls */}
        <div style={{ display: "flex", gap: 6, marginBottom: "0.75rem", justifyContent: "center" }}>
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
      </div>
    </div>
  )
}
