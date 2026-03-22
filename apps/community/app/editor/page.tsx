"use client"

import { useState, useEffect, useCallback } from "react"
import { useEditorState } from "../../hooks/useEditorState"
import EditorCanvas from "../../components/EditorCanvas"
import ToolSidebar from "../../components/ToolSidebar"
import PropertiesPanel from "../../components/PropertiesPanel"
import EditorHeader from "../../components/EditorHeader"
import AITerminal from "../../components/AITerminal"
import { ToolType, SectionType, Section } from "../../lib/types"
import { layoutToHTML } from "../../lib/layoutToHTML"
import { getDefaultEditorState } from "../../lib/defaultState"

function makeSection(type: SectionType): Section {
  const id = Math.random().toString(36).slice(2, 9)
  const base = { id, locked: false, style: { fontFamily: "'IBM Plex Mono', monospace", color: "#2a2318", padding: "0.5rem 2rem" } }
  switch (type) {
    case "text":    return { ...base, type, content: "New text block" }
    case "button":  return { ...base, type, content: "Click me →", href: "#", style: { ...base.style, fontWeight: "600" } }
    case "divider": return { ...base, type, content: "", style: { borderColor: "#c8b89a", borderWidth: "1px", margin: "0.5rem 2rem" } }
    case "image":   return { ...base, type, content: "", imageQuery: "landscape" }
    case "tags":    return { ...base, type, content: "tags", tags: ["tag1", "tag2"] }
  }
}

export default function EditorPage() {
  const [mode, setMode] = useState<"build" | "ai">("build")
  const [activeTool, setActiveTool] = useState<ToolType>("select")
  const [paintColor, setPaintColor] = useState("#2a2318")
  const [paintSize, setPaintSize] = useState(6)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [displayName, setDisplayName] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [submitResult, setSubmitResult] = useState<string | null>(null)
  const [snapshotCreatedAt, setSnapshotCreatedAt] = useState<string | null>(null)
  const [isDefault, setIsDefault] = useState(true)
  const [queueCount, setQueueCount] = useState(0)
  const [pendingAddType, setPendingAddType] = useState<SectionType | null>(null)

  const editor = useEditorState()

  useEffect(() => {
    fetch("/api/snapshot").then((r) => r.json()).then((data) => {
      if (data.snapshot) {
        setSnapshotCreatedAt(data.snapshot.createdAt)
        setIsDefault(data.snapshot.isDefault || !data.snapshot.htmlContent)
      }
    }).catch(() => {})
    fetch("/api/queue").then((r) => r.json()).then((data) => setQueueCount((data.queue ?? []).length)).catch(() => {})
  }, [])

  const selectedSection = selectedIds.length > 0
    ? (editor.state.sections.find((s) => s.id === selectedIds[0]) ?? null)
    : null

  useEffect(() => {
    if (!pendingAddType) return
    const idx = selectedIds.length > 0
      ? editor.state.sections.findIndex((s) => s.id === selectedIds[0])
      : editor.state.sections.length - 1
    editor.addSection(makeSection(pendingAddType), idx)
    setPendingAddType(null)
  }, [pendingAddType])

  const handleMoveSection = useCallback((id: string, x: number, y: number) => {
    const s = editor.state.sections.find((sec) => sec.id === id)
    editor.updatePosition(id, x, y, s?.w ?? 300, s?.h ?? 80, true)
  }, [editor])

  async function handleBuildSubmit() {
    setSubmitting(true)
    setSubmitResult(null)
    try {
      const html = layoutToHTML(editor.state)
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: "[visual build]", displayName: displayName || null, layoutHTML: html, submissionType: "visual" }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSubmitResult(`✓ queued at #${data.queuePosition} — live ${new Date(data.estimatedLiveDate).toLocaleDateString()}`)
      setQueueCount((c) => c + 1)
    } catch (err: unknown) {
      setSubmitResult(`✗ ${err instanceof Error ? err.message : "unknown error"}`)
    }
    setSubmitting(false)
  }

  async function handleAISubmit(prompt: string) {
    const res = await fetch("/api/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, displayName: displayName || null, submissionType: "ai" }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error)
    setQueueCount((c) => c + 1)
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
      <EditorHeader
        mode={mode}
        snapshotCreatedAt={snapshotCreatedAt}
        isDefault={isDefault}
        queueCount={queueCount}
        submitting={submitting}
        displayName={displayName}
        onModeChange={setMode}
        onSubmit={handleBuildSubmit}
        onDisplayNameChange={setDisplayName}
      />

      {submitResult && (
        <div style={{ background: submitResult.startsWith("✗") ? "#3a1a1a" : "#1a3a1a", color: submitResult.startsWith("✗") ? "#f5a0a0" : "#a0f5a0", fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.72rem", padding: "6px 1rem" }}>
          {submitResult}
        </div>
      )}

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <ToolSidebar
          activeTool={activeTool}
          paintColor={paintColor}
          paintSize={paintSize}
          canUndo={editor.canUndo}
          canRedo={editor.canRedo}
          onToolChange={setActiveTool}
          onPaintColorChange={setPaintColor}
          onPaintSizeChange={setPaintSize}
          onUndo={editor.undo}
          onRedo={editor.redo}
          onClear={editor.clear}
          onAddSectionType={(type) => setPendingAddType(type)}
        />

        <div style={{ flex: 1, overflowY: "auto" }}>
          <EditorCanvas
            sections={editor.state.sections}
            globalStyles={editor.state.globalStyles}
            selectedIds={selectedIds}
            activeTool={activeTool}
            paintColor={paintColor}
            paintSize={paintSize}
            paintStrokes={editor.state.paintStrokes ?? []}
            onSelectIds={setSelectedIds}
            onMoveSection={handleMoveSection}
            onErase={editor.removeSection}
            onAddStroke={editor.addPaintStroke}
          />
        </div>

        <PropertiesPanel
          selectedSection={selectedSection}
          selectedIds={selectedIds}
          globalStyles={editor.state.globalStyles}
          onUpdateStyle={editor.updateSectionStyle}
          onUpdateGlobal={editor.updateGlobalStyles}
          onUpdateContent={editor.updateSectionContent}
          onUpdateImageQuery={editor.updateImageQuery}
          onUpdateHref={editor.updateHref}
          onUpdatePosition={editor.updatePosition}
          onUpdateMultiple={editor.updateMultipleSections}
        />
      </div>

      {mode === "ai" && (
        <AITerminal onSubmit={handleAISubmit} onClose={() => setMode("build")} />
      )}
    </div>
  )
}
