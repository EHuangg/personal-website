"use client"

import { useState } from "react"
import { ToolType, SectionType } from "../lib/types"

const TOOLS: { type: ToolType; icon: string; label: string }[] = [
  { type: "select", icon: "↖", label: "Select (drag to multi-select)" },
  { type: "move",   icon: "✥", label: "Move" },
  { type: "paint",  icon: "✏", label: "Paint" },
  { type: "erase",  icon: "◻", label: "Erase" },
]

const ADD_SECTIONS: { type: SectionType; icon: string; label: string }[] = [
  { type: "text",    icon: "T",  label: "Text" },
  { type: "button",  icon: "▶",  label: "Button" },
  { type: "divider", icon: "—",  label: "Divider" },
  { type: "image",   icon: "🖼", label: "Image" },
  { type: "tags",    icon: "◈",  label: "Tags" },
]

const btn = (active: boolean, disabled = false): React.CSSProperties => ({
  width: 40, height: 40,
  background: active ? "#3a3830" : "transparent",
  border: active ? "1px solid #5a5040" : "1px solid transparent",
  borderRadius: 6,
  color: disabled ? "#3a3830" : active ? "#f5f0e8" : "#7a6a52",
  fontSize: 16,
  cursor: disabled ? "not-allowed" : "pointer",
  display: "flex", alignItems: "center", justifyContent: "center",
  transition: "all 0.1s",
  fontFamily: "monospace",
})

export default function ToolSidebar({
  activeTool, paintColor, paintSize, canUndo, canRedo,
  onToolChange, onPaintColorChange, onPaintSizeChange,
  onUndo, onRedo, onClear, onAddSectionType,
}: {
  activeTool: ToolType
  paintColor: string
  paintSize: number
  canUndo: boolean
  canRedo: boolean
  onToolChange: (tool: ToolType) => void
  onPaintColorChange: (color: string) => void
  onPaintSizeChange: (size: number) => void
  onUndo: () => void
  onRedo: () => void
  onClear: () => void
  onAddSectionType: (type: SectionType) => void
}) {
  const [addOpen, setAddOpen] = useState(false)

  return (
    <div style={{ width: 56, background: "#1e1c18", borderRight: "1px solid #2a2820", display: "flex", flexDirection: "column", alignItems: "center", padding: "0.75rem 0", gap: 2, userSelect: "none", position: "relative" }}>

      {/* Tools */}
      {TOOLS.map((tool) => (
        <button key={tool.type} title={tool.label} onClick={() => onToolChange(tool.type)} style={btn(activeTool === tool.type)}>
          {tool.icon}
        </button>
      ))}

      {/* Paint options — show when paint active */}
      {activeTool === "paint" && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "4px 0" }}>
          <div title="Paint color" style={{ position: "relative", width: 28, height: 28 }}>
            <input type="color" value={paintColor} onChange={(e) => onPaintColorChange(e.target.value)}
              style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer", width: "100%", height: "100%" }} />
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: paintColor, border: "2px solid #5a5040", pointerEvents: "none" }} />
          </div>
          <input type="range" min={2} max={40} value={paintSize} onChange={(e) => onPaintSizeChange(Number(e.target.value))}
            style={{ width: 40, accentColor: "#f5f0e8", writingMode: "vertical-lr" as const, height: 60 }} />
          <span style={{ fontSize: 9, color: "#7a6a52" }}>{paintSize}px</span>
        </div>
      )}

      <div style={{ width: 32, height: 1, background: "#2a2820", margin: "0.5rem 0" }} />

      {/* Add section + button */}
      <div style={{ position: "relative" }}>
        <button title="Add section" onClick={() => setAddOpen((o) => !o)}
          style={{ ...btn(addOpen), fontSize: 20, fontWeight: 300 }}>
          +
        </button>

        {addOpen && (
          <div style={{
            position: "absolute", left: 52, top: 0, background: "#1e1c18", border: "1px solid #3a3830",
            borderRadius: 8, padding: "0.5rem 0", zIndex: 100, minWidth: 130,
          }}>
            {ADD_SECTIONS.map((s) => (
              <button key={s.type} onClick={() => { onAddSectionType(s.type); setAddOpen(false) }}
                style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", background: "transparent", border: "none", color: "#c8b89a", fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.75rem", padding: "6px 16px", cursor: "pointer", textAlign: "left" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#2a2820" }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent" }}>
                <span style={{ fontSize: 14, width: 16 }}>{s.icon}</span>
                {s.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div style={{ width: 32, height: 1, background: "#2a2820", margin: "0.5rem 0" }} />

      {/* History */}
      {[
        { label: "↩", title: "Undo", onClick: onUndo, disabled: !canUndo },
        { label: "↪", title: "Redo", onClick: onRedo, disabled: !canRedo },
        { label: "✕", title: "Clear", onClick: onClear, disabled: false },
      ].map((b) => (
        <button key={b.title} title={b.title} onClick={b.onClick} disabled={b.disabled} style={btn(false, b.disabled)}>
          {b.label}
        </button>
      ))}
    </div>
  )
}
