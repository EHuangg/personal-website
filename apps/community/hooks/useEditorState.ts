import { useState, useCallback } from "react"
import { EditorState, Section, ComponentStyle, GlobalStyles, PaintStroke } from "../lib/types"
import { getDefaultEditorState } from "../lib/defaultState"

const MAX_HISTORY = 50

export function useEditorState(initial?: EditorState) {
  const [history, setHistory] = useState<EditorState[]>(() => [initial ?? getDefaultEditorState()])
  const [index, setIndex] = useState(0)

  const state = history[index]

  const pushFn = useCallback((updater: (cur: EditorState) => EditorState) => {
    setHistory((prev) => {
      const cur = prev[index]
      const next = updater(cur)
      const base = prev.slice(0, index + 1)
      return [...base, next].slice(-MAX_HISTORY)
    })
    setIndex((i) => Math.min(i + 1, MAX_HISTORY - 1))
  }, [index])

  const undo = useCallback(() => setIndex((i) => Math.max(0, i - 1)), [])
  const redo = useCallback(() => setIndex((i) => Math.min(history.length - 1, i + 1)), [history.length])
  const canUndo = index > 0
  const canRedo = index < history.length - 1

  const updateSectionStyle = useCallback((id: string, style: Partial<ComponentStyle>) => {
    pushFn((cur) => ({
      ...cur,
      sections: cur.sections.map((s) => s.id === id ? { ...s, style: { ...s.style, ...style } } : s),
    }))
  }, [pushFn])

  const updateSectionContent = useCallback((id: string, content: string) => {
    pushFn((cur) => ({
      ...cur,
      sections: cur.sections.map((s) => s.id === id ? { ...s, content } : s),
    }))
  }, [pushFn])

  const updateImageQuery = useCallback((id: string, query: string) => {
    pushFn((cur) => ({
      ...cur,
      sections: cur.sections.map((s) => s.id === id ? { ...s, imageQuery: query } : s),
    }))
  }, [pushFn])

  const updateHref = useCallback((id: string, href: string) => {
    pushFn((cur) => ({
      ...cur,
      sections: cur.sections.map((s) => s.id === id ? { ...s, href } : s),
    }))
  }, [pushFn])

  const updatePosition = useCallback((id: string, x: number, y: number, w: number, h: number, useAbsolute: boolean) => {
    pushFn((cur) => ({
      ...cur,
      sections: cur.sections.map((s) => s.id === id ? { ...s, x, y, w, h, useAbsolute } : s),
    }))
  }, [pushFn])

  const addSection = useCallback((section: Section, afterIndex: number) => {
    pushFn((cur) => {
      const sections = [...cur.sections]
      sections.splice(afterIndex + 1, 0, section)
      return { ...cur, sections }
    })
  }, [pushFn])

  const removeSection = useCallback((id: string) => {
    pushFn((cur) => ({ ...cur, sections: cur.sections.filter((s) => s.id !== id) }))
  }, [pushFn])

  const moveSection = useCallback((id: string, direction: "up" | "down") => {
    pushFn((cur) => {
      const idx = cur.sections.findIndex((s) => s.id === id)
      if (idx === -1) return cur
      if (direction === "up" && idx === 0) return cur
      if (direction === "down" && idx === cur.sections.length - 1) return cur
      const sections = [...cur.sections]
      const swap = direction === "up" ? idx - 1 : idx + 1
      ;[sections[idx], sections[swap]] = [sections[swap], sections[idx]]
      return { ...cur, sections }
    })
  }, [pushFn])

  const updateGlobalStyles = useCallback((styles: Partial<GlobalStyles>) => {
    pushFn((cur) => ({ ...cur, globalStyles: { ...cur.globalStyles, ...styles } }))
  }, [pushFn])

  const clear = useCallback(() => {
    pushFn(() => getDefaultEditorState())
  }, [pushFn])

  const paintSection = useCallback((id: string, color: string) => {
    pushFn((cur) => {
      const section = cur.sections.find((s) => s.id === id)
      if (!section) return cur
      const styleUpdate: Partial<ComponentStyle> =
        section.type === "divider" ? { borderColor: color } : { color }
      return {
        ...cur,
        sections: cur.sections.map((s) =>
          s.id === id ? { ...s, style: { ...s.style, ...styleUpdate } } : s
        ),
      }
    })
  }, [pushFn])

  const addPaintStroke = useCallback((stroke: PaintStroke) => {
    pushFn((cur) => ({ ...cur, paintStrokes: [...(cur.paintStrokes ?? []), stroke] }))
  }, [pushFn])

  const clearPaintStrokes = useCallback(() => {
    pushFn((cur) => ({ ...cur, paintStrokes: [] }))
  }, [pushFn])

  const updateMultipleSections = useCallback((ids: string[], style: Partial<ComponentStyle>) => {
    pushFn((cur) => ({
      ...cur,
      sections: cur.sections.map((s) => ids.includes(s.id) ? { ...s, style: { ...s.style, ...style } } : s),
    }))
  }, [pushFn])

  return {
    state,
    undo,
    redo,
    canUndo,
    canRedo,
    updateSectionStyle,
    updateSectionContent,
    updateImageQuery,
    updateHref,
    updatePosition,
    addSection,
    removeSection,
    moveSection,
    updateGlobalStyles,
    clear,
    paintSection,
    addPaintStroke,
    clearPaintStrokes,
    updateMultipleSections,
  }
}