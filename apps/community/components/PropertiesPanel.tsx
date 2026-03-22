"use client"

import { Section, ComponentStyle, GlobalStyles } from "../lib/types"

const FONTS = [
  "'IBM Plex Mono', monospace",
  "Georgia, serif",
  "'Times New Roman', serif",
  "Arial, sans-serif",
  "'Helvetica Neue', sans-serif",
  "Impact, sans-serif",
  "'Courier New', monospace",
  "'Playfair Display', serif",
  "'Roboto', sans-serif",
  "'Montserrat', sans-serif",
  "'Oswald', sans-serif",
  "'Bebas Neue', cursive",
  "'Space Mono', monospace",
  "'Press Start 2P', cursive",
  "'Pacifico', cursive",
  "'Dancing Script', cursive",
]

function Label({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: "0.58rem", letterSpacing: "0.12em", color: "#7a6a52", marginBottom: "0.2rem", textTransform: "uppercase" }}>{children}</div>
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "1rem" }}>
      <div style={{ fontSize: "0.6rem", letterSpacing: "0.18em", color: "#4a4030", textTransform: "uppercase", padding: "0.4rem 0", borderBottom: "1px solid #2a2820", marginBottom: "0.6rem" }}>{title}</div>
      {children}
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "0.5rem" }}>
      <Label>{label}</Label>
      {children}
    </div>
  )
}

function ColorInput({ value, onChange }: { value?: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
      <input type="color" value={value ?? "#000000"} onChange={(e) => onChange(e.target.value)}
        style={{ width: 26, height: 26, border: "none", borderRadius: 4, cursor: "pointer", padding: 0, flexShrink: 0 }} />
      <input type="text" value={value ?? ""} onChange={(e) => onChange(e.target.value)}
        style={{ flex: 1, background: "#2a2820", border: "1px solid #3a3830", borderRadius: 3, color: "#f5f0e8", fontSize: "0.7rem", padding: "2px 5px", fontFamily: "monospace", minWidth: 0 }} />
    </div>
  )
}

function TextInput({ value, onChange, placeholder }: { value?: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input type="text" value={value ?? ""} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
      style={{ width: "100%", background: "#2a2820", border: "1px solid #3a3830", borderRadius: 3, color: "#f5f0e8", fontSize: "0.7rem", padding: "2px 5px", fontFamily: "monospace" }} />
  )
}

function Select({ value, options, onChange }: { value?: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <select value={value ?? ""} onChange={(e) => onChange(e.target.value)}
      style={{ width: "100%", background: "#2a2820", border: "1px solid #3a3830", borderRadius: 3, color: "#f5f0e8", fontSize: "0.7rem", padding: "2px 4px" }}>
      {options.map((o) => <option key={o} value={o}>{o.replace(/'/g, "").split(",")[0]}</option>)}
    </select>
  )
}

function NumInput({ value, unit = "px", onChange }: { value?: string; unit?: string; onChange: (v: string) => void }) {
  const num = parseFloat(value ?? "0") || 0
  return (
    <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
      <input type="number" value={num} step={unit === "rem" ? 0.1 : 1}
        onChange={(e) => onChange(`${e.target.value}${unit}`)}
        style={{ flex: 1, background: "#2a2820", border: "1px solid #3a3830", borderRadius: 3, color: "#f5f0e8", fontSize: "0.7rem", padding: "2px 5px", minWidth: 0 }} />
      {unit && <span style={{ fontSize: "0.6rem", color: "#7a6a52", flexShrink: 0 }}>{unit}</span>}
    </div>
  )
}

function TwoCol({ children }: { children: React.ReactNode }) {
  return <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>{children}</div>
}

export default function PropertiesPanel({
  selectedSection, selectedIds, globalStyles,
  onUpdateStyle, onUpdateGlobal, onUpdateContent,
  onUpdateImageQuery, onUpdateHref, onUpdatePosition,
  onUpdateMultiple,
}: {
  selectedSection: Section | null
  selectedIds: string[]
  globalStyles: GlobalStyles
  onUpdateStyle: (id: string, style: Partial<ComponentStyle>) => void
  onUpdateGlobal: (styles: Partial<GlobalStyles>) => void
  onUpdateContent: (id: string, content: string) => void
  onUpdateImageQuery: (id: string, query: string) => void
  onUpdateHref: (id: string, href: string) => void
  onUpdatePosition: (id: string, x: number, y: number, w: number, h: number, useAbsolute: boolean) => void
  onUpdateMultiple: (ids: string[], style: Partial<ComponentStyle>) => void
}) {
  const s = selectedSection
  const update = (style: Partial<ComponentStyle>) => {
    if (!s) return
    if (selectedIds.length > 1) {
      onUpdateMultiple(selectedIds, style)
    } else {
      onUpdateStyle(s.id, style)
    }
  }

  const panelStyle: React.CSSProperties = {
    width: 220,
    background: "#1e1c18",
    borderLeft: "1px solid #2a2820",
    padding: "0.75rem",
    overflowY: "auto",
    fontFamily: "'IBM Plex Mono', monospace",
    color: "#f5f0e8",
    fontSize: "0.72rem",
    flexShrink: 0,
  }

  // Multi-select: show limited controls
  if (selectedIds.length > 1) {
    return (
      <div style={panelStyle}>
        <div style={{ fontSize: "0.65rem", color: "#7a6a52", marginBottom: "0.75rem" }}>{selectedIds.length} selected</div>
        <Group title="Typography">
          <Row label="Color"><ColorInput value={s?.style.color} onChange={(v) => update({ color: v })} /></Row>
          <Row label="Font"><Select value={s?.style.fontFamily} options={FONTS} onChange={(v) => update({ fontFamily: v })} /></Row>
          <Row label="Size"><NumInput value={s?.style.fontSize} unit="rem" onChange={(v) => update({ fontSize: v })} /></Row>
        </Group>
        <Group title="Box">
          <Row label="Background"><ColorInput value={s?.style.background} onChange={(v) => update({ background: v })} /></Row>
          <Row label="Opacity">
            <input type="range" min={0} max={1} step={0.05} value={s?.style.opacity ?? 1}
              onChange={(e) => update({ opacity: parseFloat(e.target.value) })} style={{ width: "100%" }} />
          </Row>
        </Group>
      </div>
    )
  }

  if (!s) {
    return (
      <div style={panelStyle}>
        <Group title="Page">
          <Row label="Background"><ColorInput value={globalStyles.background} onChange={(v) => onUpdateGlobal({ background: v })} /></Row>
          <Row label="Text color"><ColorInput value={globalStyles.textColor} onChange={(v) => onUpdateGlobal({ textColor: v })} /></Row>
          <Row label="Font"><Select value={globalStyles.fontFamily} options={FONTS} onChange={(v) => onUpdateGlobal({ fontFamily: v })} /></Row>
        </Group>
      </div>
    )
  }

  return (
    <div style={panelStyle}>
      <div style={{ fontSize: "0.6rem", color: "#5a5040", letterSpacing: "0.1em", marginBottom: "0.5rem" }}>{s.type.toUpperCase()}</div>

      {/* Content */}
      {(s.type === "text" || s.type === "button") && (
        <Group title="Content">
          <Row label="Text">
            <textarea value={s.content} onChange={(e) => onUpdateContent(s.id, e.target.value)}
              rows={3} style={{ width: "100%", background: "#2a2820", border: "1px solid #3a3830", borderRadius: 3, color: "#f5f0e8", fontSize: "0.7rem", padding: "4px 5px", resize: "vertical", fontFamily: "inherit" }} />
          </Row>
          {s.type === "button" && (
            <Row label="Link URL">
              <TextInput value={s.href} onChange={(v) => onUpdateHref(s.id, v)} placeholder="https://..." />
            </Row>
          )}
        </Group>
      )}

      {s.type === "image" && (
        <Group title="Content">
          <Row label="Search keyword">
            <TextInput value={s.imageQuery} onChange={(v) => onUpdateImageQuery(s.id, v)} placeholder="mountain lake" />
          </Row>
        </Group>
      )}

      {/* Typography */}
      {s.type !== "divider" && (
        <Group title="Typography">
          <Row label="Color"><ColorInput value={s.style.color} onChange={(v) => update({ color: v })} /></Row>
          <Row label="Font"><Select value={s.style.fontFamily} options={FONTS} onChange={(v) => update({ fontFamily: v })} /></Row>
          <TwoCol>
            <Row label="Size"><NumInput value={s.style.fontSize} unit="rem" onChange={(v) => update({ fontSize: v })} /></Row>
            <Row label="Weight"><Select value={s.style.fontWeight} options={["300","400","500","600","700","900"]} onChange={(v) => update({ fontWeight: v })} /></Row>
          </TwoCol>
          <Row label="Align"><Select value={s.style.textAlign} options={["left","center","right"]} onChange={(v) => update({ textAlign: v as "left"|"center"|"right" })} /></Row>
          <TwoCol>
            <Row label="Tracking"><TextInput value={s.style.letterSpacing} onChange={(v) => update({ letterSpacing: v })} placeholder="0.1em" /></Row>
            <Row label="Leading"><TextInput value={s.style.lineHeight} onChange={(v) => update({ lineHeight: v })} placeholder="1.6" /></Row>
          </TwoCol>
        </Group>
      )}

      {/* Box */}
      <Group title="Box">
        <Row label="Background"><ColorInput value={s.style.background} onChange={(v) => update({ background: v })} /></Row>
        <TwoCol>
          <Row label="Width"><TextInput value={s.style.width} onChange={(v) => update({ width: v })} placeholder="auto" /></Row>
          <Row label="Height"><TextInput value={s.style.height} onChange={(v) => update({ height: v })} placeholder="auto" /></Row>
        </TwoCol>
        <Row label="Padding"><TextInput value={s.style.padding} onChange={(v) => update({ padding: v })} placeholder="1rem 2rem" /></Row>
        <Row label="Margin"><TextInput value={s.style.margin} onChange={(v) => update({ margin: v })} placeholder="0 auto" /></Row>
        <Row label="Border radius"><NumInput value={s.style.borderRadius} unit="px" onChange={(v) => update({ borderRadius: v })} /></Row>
        {s.type === "divider" && (
          <>
            <Row label="Line color"><ColorInput value={s.style.borderColor} onChange={(v) => update({ borderColor: v })} /></Row>
            <Row label="Line width"><NumInput value={s.style.borderWidth} unit="px" onChange={(v) => update({ borderWidth: v })} /></Row>
          </>
        )}
        {s.type !== "divider" && (
          <>
            <Row label="Border color"><ColorInput value={s.style.borderColor} onChange={(v) => update({ borderColor: v })} /></Row>
            <TwoCol>
              <Row label="Border w"><NumInput value={s.style.borderWidth} unit="px" onChange={(v) => update({ borderWidth: v })} /></Row>
              <Row label="Style"><Select value={s.style.borderStyle ?? "solid"} options={["solid","dashed","dotted","none"]} onChange={(v) => update({ borderStyle: v })} /></Row>
            </TwoCol>
          </>
        )}
      </Group>

      {/* Layer */}
      <Group title="Layer">
        <Row label="Z-index"><NumInput value={String(s.style.zIndex ?? 0)} unit="" onChange={(v) => update({ zIndex: parseInt(v) || 0 })} /></Row>
        <Row label="Opacity">
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <input type="range" min={0} max={1} step={0.05} value={s.style.opacity ?? 1}
              onChange={(e) => update({ opacity: parseFloat(e.target.value) })} style={{ flex: 1 }} />
            <span style={{ fontSize: "0.65rem", color: "#7a6a52", minWidth: 24 }}>{Math.round((s.style.opacity ?? 1) * 100)}%</span>
          </div>
        </Row>
      </Group>

      {/* Position */}
      <Group title="Position">
        <Row label="Mode">
          <div style={{ display: "flex", gap: 4 }}>
            {(["flow", "absolute"] as const).map((mode) => (
              <button key={mode} onClick={() => onUpdatePosition(s.id, s.x ?? 0, s.y ?? 0, s.w ?? 300, s.h ?? 80, mode === "absolute")}
                style={{ flex: 1, padding: "3px 0", background: (s.useAbsolute ? "absolute" : "flow") === mode ? "#3a3830" : "transparent", border: "1px solid #3a3830", borderRadius: 3, color: "#f5f0e8", fontFamily: "inherit", fontSize: "0.65rem", cursor: "pointer" }}>
                {mode}
              </button>
            ))}
          </div>
        </Row>
        {s.useAbsolute && (
          <TwoCol>
            <Row label="X"><NumInput value={String(s.x ?? 0)} unit="px" onChange={(v) => onUpdatePosition(s.id, parseFloat(v)||0, s.y??0, s.w??300, s.h??80, true)} /></Row>
            <Row label="Y"><NumInput value={String(s.y ?? 0)} unit="px" onChange={(v) => onUpdatePosition(s.id, s.x??0, parseFloat(v)||0, s.w??300, s.h??80, true)} /></Row>
            <Row label="W"><NumInput value={String(s.w ?? 300)} unit="px" onChange={(v) => onUpdatePosition(s.id, s.x??0, s.y??0, parseFloat(v)||300, s.h??80, true)} /></Row>
            <Row label="H"><NumInput value={String(s.h ?? 80)} unit="px" onChange={(v) => onUpdatePosition(s.id, s.x??0, s.y??0, s.w??300, parseFloat(v)||80, true)} /></Row>
          </TwoCol>
        )}
      </Group>
    </div>
  )
}
