export type ComponentStyle = {
  color?: string
  fontFamily?: string
  fontSize?: string
  fontWeight?: string
  fontStyle?: string
  textAlign?: "left" | "center" | "right"
  letterSpacing?: string
  lineHeight?: string
  textDecoration?: string
  background?: string
  padding?: string
  margin?: string
  width?: string
  height?: string
  borderWidth?: string
  borderColor?: string
  borderStyle?: string
  borderRadius?: string
  opacity?: number
  zIndex?: number
}

export type SectionType = "text" | "button" | "divider" | "image" | "tags"

export type Section = {
  id: string
  type: SectionType
  locked: boolean
  content: string
  href?: string
  imageQuery?: string
  tags?: string[]
  style: ComponentStyle
  x?: number
  y?: number
  w?: number
  h?: number
  useAbsolute?: boolean
}

export type GlobalStyles = {
  background: string
  fontFamily: string
  primaryColor: string
  textColor: string
}

export type ToolType = "select" | "move" | "paint" | "erase"

export type SubmissionType = "visual" | "ai"

export type EditorState = {
  sections: Section[]
  globalStyles: GlobalStyles
  paintStrokes: PaintStroke[]
}

export type PaintStroke = {
  id: string
  points: { x: number; y: number }[]
  color: string
  size: number
}