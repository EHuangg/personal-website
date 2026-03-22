"use client"

import { useRef, useState, useEffect } from "react"
import { Section, ToolType, GlobalStyles, PaintStroke } from "../lib/types"
import { siteConfig } from "@personal-website/shared"

const GOOGLE_FONTS_URL = "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600&family=Playfair+Display:wght@400;700&family=Roboto:wght@400;700&family=Montserrat:wght@400;700&family=Oswald:wght@400;700&family=Bebas+Neue&family=Space+Mono:wght@400;700&family=Press+Start+2P&family=Pacifico&family=Dancing+Script:wght@400;700&display=swap"

function SectionEl({
  section, selected, multiSelected, activeTool, onMouseDown, onContextMenu,
}: {
  section: Section
  selected: boolean
  multiSelected: boolean
  activeTool: ToolType
  onMouseDown: (e: React.MouseEvent) => void
  onContextMenu: (e: React.MouseEvent) => void
}) {
  const isHighlighted = selected || multiSelected
  const cursor = activeTool === "move" ? "move" : activeTool === "erase" ? "cell" : activeTool === "paint" ? "none" : "pointer"

  const baseStyle: React.CSSProperties = {
    ...(section.style as React.CSSProperties),
    position: section.useAbsolute ? "absolute" : "relative",
    left: section.useAbsolute ? section.x : undefined,
    top: section.useAbsolute ? section.y : undefined,
    width: section.useAbsolute ? section.w : undefined,
    height: section.useAbsolute ? section.h : undefined,
    outline: isHighlighted ? `2px solid ${selected ? "#4a9eff" : "#a0cfff"}` : "2px solid transparent",
    outlineOffset: 2,
    cursor,
    userSelect: "none",
    boxSizing: "border-box",
  }

  if (section.type === "divider") {
    return (
      <div style={{ position: "relative", padding: "4px 0", cursor }} onMouseDown={onMouseDown} onContextMenu={onContextMenu}>
        {isHighlighted && <div style={{ position: "absolute", inset: 0, background: "rgba(74,158,255,0.07)", pointerEvents: "none" }} />}
        <hr style={{ border: "none", borderTop: `${section.style.borderWidth ?? "1px"} solid ${section.style.borderColor ?? "#c8b89a"}`, margin: section.style.margin ?? "0.5rem 2rem" }} />
      </div>
    )
  }

  if (section.type === "image") {
    return (
      <div style={baseStyle} onMouseDown={onMouseDown} onContextMenu={onContextMenu}>
        <img src={`https://picsum.photos/seed/${section.imageQuery ?? "landscape"}/800/400`} alt={section.imageQuery ?? "photo"} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", pointerEvents: "none" }} />
      </div>
    )
  }

  if (section.type === "tags" && section.tags?.includes("github")) {
    return (
      <div style={{ ...baseStyle, display: "flex", gap: "1.5rem", flexWrap: "wrap" }} onMouseDown={onMouseDown} onContextMenu={onContextMenu}>
        {["github ↗", "email ↗", "linkedin ↗", "resume ↓"].map((t) => (
          <span key={t} style={{ fontSize: section.style.fontSize ?? "0.8rem", color: section.style.color, fontFamily: section.style.fontFamily }}>{t}</span>
        ))}
      </div>
    )
  }

  if (section.type === "button") {
    return (
      <div style={baseStyle} onMouseDown={onMouseDown} onContextMenu={onContextMenu}>
        <span style={{ display: "block", fontFamily: section.style.fontFamily, fontSize: section.style.fontSize, fontWeight: section.style.fontWeight, color: section.style.color, textAlign: section.style.textAlign, letterSpacing: section.style.letterSpacing }}>
          {section.content}
        </span>
      </div>
    )
  }

  return (
    <div style={baseStyle} onMouseDown={onMouseDown} onContextMenu={onContextMenu}>
      <span style={{ display: "block", fontFamily: section.style.fontFamily, fontSize: section.style.fontSize, fontWeight: section.style.fontWeight, color: section.style.color, textAlign: section.style.textAlign, letterSpacing: section.style.letterSpacing, lineHeight: section.style.lineHeight, opacity: section.style.opacity }}>
        {section.content}
      </span>
    </div>
  )
}

export default function EditorCanvas({
  sections, globalStyles, selectedIds, activeTool, paintColor, paintSize, paintStrokes,
  onSelectIds, onMoveSection, onErase, onAddStroke,
}: {
  sections: Section[]
  globalStyles: GlobalStyles
  selectedIds: string[]
  activeTool: ToolType
  paintColor: string
  paintSize: number
  paintStrokes: PaintStroke[]
  onSelectIds: (ids: string[]) => void
  onMoveSection: (id: string, x: number, y: number) => void
  onErase: (id: string) => void
  onAddStroke: (stroke: PaintStroke) => void
}) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const paintCanvasRef = useRef<HTMLCanvasElement>(null)
  const [selBox, setSelBox] = useState<{ x: number; y: number; w: number; h: number } | null>(null)
  const dragState = useRef<{ type: "select" | "move" | "paint"; startX: number; startY: number; sectionId?: string; origX?: number; origY?: number; currentStroke?: PaintStroke } | null>(null)

  // Draw paint strokes onto canvas
  useEffect(() => {
    const c = paintCanvasRef.current
    if (!c) return
    const ctx = c.getContext("2d")
    if (!ctx) return
    ctx.clearRect(0, 0, c.width, c.height)
    for (const stroke of paintStrokes) {
      if (stroke.points.length < 2) continue
      ctx.strokeStyle = stroke.color
      ctx.lineWidth = stroke.size
      ctx.lineCap = "round"
      ctx.lineJoin = "round"
      ctx.beginPath()
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y)
      for (const pt of stroke.points.slice(1)) ctx.lineTo(pt.x, pt.y)
      ctx.stroke()
    }
  }, [paintStrokes])

  const getCanvasPos = (e: React.MouseEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  const handleMouseDown = (e: React.MouseEvent, sectionId?: string) => {
    if (e.button !== 0) return
    const { x, y } = getCanvasPos(e)

    if (activeTool === "erase" && sectionId) {
      onErase(sectionId)
      return
    }

    if (activeTool === "paint") {
      e.preventDefault()
      const stroke: PaintStroke = { id: Math.random().toString(36).slice(2), points: [{ x, y }], color: paintColor, size: paintSize }
      dragState.current = { type: "paint", startX: x, startY: y, currentStroke: stroke }
      return
    }

    if (activeTool === "move" && sectionId) {
      e.preventDefault()
      const section = sections.find((s) => s.id === sectionId)
      dragState.current = { type: "move", startX: e.clientX, startY: e.clientY, sectionId, origX: section?.x ?? 0, origY: section?.y ?? 0 }
      if (!selectedIds.includes(sectionId)) onSelectIds([sectionId])
      return
    }

    if (activeTool === "select") {
      if (sectionId) {
        if (e.shiftKey) {
          onSelectIds(selectedIds.includes(sectionId) ? selectedIds.filter((id) => id !== sectionId) : [...selectedIds, sectionId])
        } else {
          onSelectIds([sectionId])
        }
      } else {
        dragState.current = { type: "select", startX: x, startY: y }
        onSelectIds([])
      }
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    const ds = dragState.current
    if (!ds) return

    if (ds.type === "paint" && ds.currentStroke) {
      const { x, y } = getCanvasPos(e)
      ds.currentStroke = { ...ds.currentStroke, points: [...ds.currentStroke.points, { x, y }] }
      // Live draw
      const c = paintCanvasRef.current
      if (c) {
        const ctx = c.getContext("2d")
        if (ctx) {
          ctx.strokeStyle = ds.currentStroke.color
          ctx.lineWidth = ds.currentStroke.size
          ctx.lineCap = "round"
          ctx.lineJoin = "round"
          const pts = ds.currentStroke.points
          if (pts.length >= 2) {
            ctx.beginPath()
            ctx.moveTo(pts[pts.length - 2].x, pts[pts.length - 2].y)
            ctx.lineTo(x, y)
            ctx.stroke()
          }
        }
      }
    }

    if (ds.type === "select") {
      const { x, y } = getCanvasPos(e)
      const sx = Math.min(x, ds.startX), sy = Math.min(y, ds.startY)
      const sw = Math.abs(x - ds.startX), sh = Math.abs(y - ds.startY)
      setSelBox({ x: sx, y: sy, w: sw, h: sh })
    }

    if (ds.type === "move" && ds.sectionId !== undefined) {
      const dx = e.clientX - ds.startX
      const dy = e.clientY - ds.startY
      onMoveSection(ds.sectionId, (ds.origX ?? 0) + dx, (ds.origY ?? 0) + dy)
    }
  }

  const handleMouseUp = (e: React.MouseEvent) => {
    const ds = dragState.current
    if (!ds) return

    if (ds.type === "paint" && ds.currentStroke && ds.currentStroke.points.length > 1) {
      onAddStroke(ds.currentStroke)
    }

    if (ds.type === "select" && selBox) {
      const rect = canvasRef.current!.getBoundingClientRect()
      const hit = sections.filter((s) => {
        const el = document.getElementById(`section-${s.id}`)
        if (!el) return false
        const er = el.getBoundingClientRect()
        const ex = er.left - rect.left, ey = er.top - rect.top
        return ex < selBox.x + selBox.w && ex + er.width > selBox.x && ey < selBox.y + selBox.h && ey + er.height > selBox.y
      })
      onSelectIds(hit.map((s) => s.id))
      setSelBox(null)
    }

    dragState.current = null
  }

  const flowSections = sections.filter((s) => !s.useAbsolute)
  const absSections = sections.filter((s) => s.useAbsolute)

  return (
    <div
      ref={canvasRef}
      style={{ background: globalStyles.background, minHeight: "100%", fontFamily: globalStyles.fontFamily, color: globalStyles.textColor, position: "relative", cursor: activeTool === "paint" ? "none" : "default" }}
      onMouseDown={(e) => handleMouseDown(e)}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <link rel="stylesheet" href={GOOGLE_FONTS_URL} />

      {/* Paint canvas layer */}
      <canvas
        ref={paintCanvasRef}
        width={2000} height={4000}
        style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 10, width: "100%", height: "100%" }}
      />

      {/* Selection box */}
      {selBox && (
        <div style={{ position: "absolute", left: selBox.x, top: selBox.y, width: selBox.w, height: selBox.h, border: "1px dashed #4a9eff", background: "rgba(74,158,255,0.08)", pointerEvents: "none", zIndex: 20 }} />
      )}

      {/* Custom paint cursor */}
      {activeTool === "paint" && (
        <style>{`* { cursor: none !important; }`}</style>
      )}

      {/* Flow sections */}
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "2rem 0 6rem" }}>
        {flowSections.map((section) => (
          <div id={`section-${section.id}`} key={section.id}>
            <SectionEl
              section={section}
              selected={selectedIds.length === 1 && selectedIds[0] === section.id}
              multiSelected={selectedIds.length > 1 && selectedIds.includes(section.id)}
              activeTool={activeTool}
              onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e, section.id) }}
              onContextMenu={(e) => e.preventDefault()}
            />
          </div>
        ))}
      </div>

      {/* Absolute sections */}
      {absSections.map((section) => (
        <div id={`section-${section.id}`} key={section.id}>
          <SectionEl
            section={section}
            selected={selectedIds.length === 1 && selectedIds[0] === section.id}
            multiSelected={selectedIds.length > 1 && selectedIds.includes(section.id)}
            activeTool={activeTool}
            onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e, section.id) }}
            onContextMenu={(e) => e.preventDefault()}
          />
        </div>
      ))}
    </div>
  )
}
