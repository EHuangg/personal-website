"use client"

import { useRef, useState, useCallback, useEffect, useMemo } from "react"

const SIZE = 16
const BASE_CELL = 10

const PALETTE = ["#D00000", "#000000", "#FFFFFF"]

function emptyGrid() {
  return Array.from({ length: SIZE }, () => Array(SIZE).fill(""))
}

function cloneGrid(grid: string[][]) {
  return grid.map((row) => [...row])
}

function serializeGrid(grid: string[][]) {
  return grid.map((row) => row.join(",")).join("|")
}

export default function PixelArtDrawer({ onSubmit, onCancel, initialArt, submitting = false, onDelete, statusMessage, statusTone = "neutral" }: {
  onSubmit: (dataUrl: string) => void
  onCancel: () => void
  initialArt?: string
  submitting?: boolean
  onDelete?: () => void
  statusMessage?: string | null
  statusTone?: "neutral" | "error" | "success"
}) {
  const [grid, setGrid] = useState<string[][]>(emptyGrid)
  const [baselineGrid, setBaselineGrid] = useState<string[][]>(emptyGrid)
  const [color, setColor] = useState("#D00000")
  const [erasing, setErasing] = useState(false)
  const [drawing, setDrawing] = useState(false)
  const [boardPixels, setBoardPixels] = useState(SIZE * BASE_CELL)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const centerPaneRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const centerPane = centerPaneRef.current
    if (!centerPane) return
    const recalc = () => {
      const rect = centerPane.getBoundingClientRect()
      const next = Math.max(96, Math.floor(Math.min(rect.width, rect.height)))
      setBoardPixels(next)
    }
    recalc()
    const observer = new ResizeObserver(recalc)
    observer.observe(centerPane)
    return () => observer.disconnect()
  }, [])

  const cellSize = Math.max(7, Math.floor(boardPixels / SIZE))

  useEffect(() => {
    if (!initialArt) return
    const img = new Image()
    img.onload = () => {
      const c = document.createElement("canvas")
      c.width = SIZE
      c.height = SIZE
      const ctx = c.getContext("2d")!
      ctx.drawImage(img, 0, 0, SIZE, SIZE)
      const loadedGrid = Array.from({ length: SIZE }, (_, y) =>
        Array.from({ length: SIZE }, (_, x) => {
          const d = ctx.getImageData(x, y, 1, 1).data
          if (d[3] === 0) return ""
          return `#${[d[0], d[1], d[2]].map((v) => v.toString(16).padStart(2, "0")).join("")}`
        }),
      )
      setBaselineGrid(loadedGrid)
      setGrid(cloneGrid(loadedGrid))
    }
    img.src = initialArt
  }, [initialArt])

  const isDirty = useMemo(() => serializeGrid(grid) !== serializeGrid(baselineGrid), [grid, baselineGrid])

  useEffect(() => {
    const c = canvasRef.current
    if (!c) return
    const ctx = c.getContext("2d")!
    ctx.clearRect(0, 0, c.width, c.height)
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const cell = grid[y][x]
        ctx.fillStyle = cell || "#111111"
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize)
        ctx.strokeStyle = "rgba(255,255,255,0.06)"
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
    c.width = SIZE
    c.height = SIZE
    const ctx = c.getContext("2d")!
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        ctx.fillStyle = grid[y][x] || "transparent"
        ctx.fillRect(x, y, 1, 1)
      }
    }
    return c.toDataURL("image/png")
  }

  const clear = () => setGrid(emptyGrid())

  const handleCancel = () => {
    setGrid(cloneGrid(baselineGrid))
    setErasing(false)
    onCancel()
  }

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", gap: 12, padding: 16, background: "#000000" }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center", justifyContent: "center" }}>
        {PALETTE.map((paletteColor) => (
          <button
            key={paletteColor}
            type="button"
            onClick={() => { setColor(paletteColor); setErasing(false) }}
            style={{
              width: 32,
              height: 32,
              background: paletteColor,
              border: color === paletteColor && !erasing ? "3px solid #D00000" : "2px solid rgba(255,255,255,0.2)",
              cursor: "pointer",
              outline: color === paletteColor && !erasing ? "2px solid #fff" : "none",
            }}
          />
        ))}
        <button
          type="button"
          onClick={() => setErasing((v) => !v)}
          style={{
            padding: "6px 12px",
            background: erasing ? "#D00000" : "transparent",
            color: "#fff",
            border: "2px solid #fff",
            fontFamily: "var(--font-mono)",
            fontSize: "0.65rem",
            textTransform: "uppercase",
            letterSpacing: "0.14em",
            cursor: "pointer",
          }}
        >
          {erasing ? "ERASING" : "ERASE"}
        </button>
      </div>

      <div ref={centerPaneRef} style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", minHeight: 0 }}>
        <canvas
          ref={canvasRef}
          width={SIZE * cellSize}
          height={SIZE * cellSize}
          style={{
            border: "2px solid #D00000",
            backgroundColor: "#111",
            cursor: erasing ? "cell" : "crosshair",
            imageRendering: "pixelated",
            touchAction: "none",
          }}
          onMouseDown={(e) => { setDrawing(true); paint(e.clientX, e.clientY) }}
          onMouseMove={(e) => { if (drawing) paint(e.clientX, e.clientY) }}
          onMouseUp={() => setDrawing(false)}
          onMouseLeave={() => setDrawing(false)}
          onTouchStart={(e) => { e.preventDefault(); setDrawing(true); paint(e.touches[0].clientX, e.touches[0].clientY) }}
          onTouchMove={(e) => { e.preventDefault(); if (drawing) paint(e.touches[0].clientX, e.touches[0].clientY) }}
          onTouchEnd={() => setDrawing(false)}
          onTouchCancel={() => setDrawing(false)}
        />
      </div>

      <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
        <button type="button" onClick={clear} style={{ padding: "8px 16px", background: "transparent", color: "#fff", border: "2px solid rgba(255,255,255,0.2)", fontFamily: "var(--font-display)", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.1em", cursor: "pointer" }}>
          CLEAR
        </button>
        <button type="button" onClick={handleCancel} style={{ padding: "8px 16px", background: "transparent", color: "#fff", border: "2px solid rgba(255,255,255,0.2)", fontFamily: "var(--font-display)", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.1em", cursor: "pointer" }}>
          CANCEL
        </button>
        {onDelete && (
          <button type="button" onClick={onDelete} style={{ padding: "8px 16px", background: "transparent", color: "#D00000", border: "2px solid #D00000", fontFamily: "var(--font-display)", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.1em", cursor: "pointer" }}>
            DELETE
          </button>
        )}
        <button type="button" onClick={() => onSubmit(toDataUrl())} disabled={!isDirty || submitting} style={{ padding: "8px 20px", background: !isDirty || submitting ? "rgba(255,255,255,0.1)" : "#D00000", color: "#fff", border: "none", fontFamily: "var(--font-display)", fontSize: "0.8rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em", cursor: !isDirty || submitting ? "not-allowed" : "pointer" }}>
          {submitting ? "SAVING..." : "SAVE"}
        </button>
      </div>

      {statusMessage && (
        <div style={{ textAlign: "center", fontFamily: "var(--font-mono)", fontSize: "0.65rem", letterSpacing: "0.12em", color: statusTone === "error" ? "#D00000" : statusTone === "success" ? "#fff" : "rgba(255,255,255,0.5)" }}>
          {statusMessage}
        </div>
      )}
    </div>
  )
}
