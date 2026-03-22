import { EditorState, Section } from "./types"
import { siteConfig } from "@personal-website/shared"

function styleToCSS(section: Section): string {
  const s = section.style
  const props: Record<string, string | number | undefined> = {
    color: s.color,
    background: s.background,
    "font-family": s.fontFamily,
    "font-size": s.fontSize,
    "font-weight": s.fontWeight,
    "font-style": s.fontStyle,
    "text-align": s.textAlign,
    "letter-spacing": s.letterSpacing,
    "line-height": s.lineHeight,
    "text-decoration": s.textDecoration,
    padding: s.padding,
    margin: s.margin,
    width: s.width,
    height: s.height,
    "border-width": s.borderWidth,
    "border-color": s.borderColor,
    "border-style": s.borderStyle,
    "border-radius": s.borderRadius,
    opacity: s.opacity,
    "z-index": s.zIndex,
  }

  if (section.useAbsolute) {
    props.position = "absolute"
    props.left = `${section.x ?? 0}px`
    props.top = `${section.y ?? 0}px`
    props.width = `${section.w ?? 300}px`
    props.height = `${section.h ?? 80}px`
  }

  return Object.entries(props)
    .filter(([, v]) => v !== undefined && v !== "")
    .map(([k, v]) => `${k}: ${v}`)
    .join("; ")
}

function renderSection(section: Section): string {
  const css = styleToCSS(section)

  switch (section.type) {
    case "text":
      return `<p style="${css}">${section.content}</p>`

    case "button":
      if (section.href && section.href !== "#") {
        return `<a href="${section.href}" target="_blank" rel="noopener noreferrer" style="${css}; display:inline-block; text-decoration:none;">${section.content}</a>`
      }
      return `<button style="${css}; cursor:pointer; border:none;">${section.content}</button>`

    case "divider":
      return `<hr style="border:none; border-top:${section.style.borderWidth ?? "1px"} solid ${section.style.borderColor ?? "#c8b89a"}; margin:${section.style.margin ?? "0.5rem 2rem"};">`

    case "image":
      return `<div style="${css}"><img src="https://picsum.photos/800/400" alt="${section.imageQuery ?? "photo"}" style="width:100%; height:100%; object-fit:cover; display:block;"></div>`

    case "tags":
      if (section.tags?.includes("github")) {
        return `<div style="${css}; display:flex; gap:1.5rem; flex-wrap:wrap;">
          <a href="${siteConfig.links.github}" target="_blank" style="text-decoration:none; color:inherit;">github ↗</a>
          <a href="mailto:${siteConfig.links.email}" style="text-decoration:none; color:inherit;">email ↗</a>
          <a href="${siteConfig.links.linkedin}" target="_blank" style="text-decoration:none; color:inherit;">linkedin ↗</a>
          <a href="${siteConfig.links.resume}" download style="text-decoration:none; color:inherit;">resume ↓</a>
        </div>`
      }
      return `<div style="${css}; display:flex; gap:0.5rem; flex-wrap:wrap;">
        ${(section.tags ?? []).map((t) => `<span style="border:1px solid currentColor; padding:0.15rem 0.5rem; font-size:0.75rem;">${t}</span>`).join("")}
      </div>`

    default:
      return ""
  }
}

export function layoutToHTML(state: EditorState): string {
  const { globalStyles, sections } = state
  const flowSections = sections.filter((s) => !s.useAbsolute)
  const absSections = sections.filter((s) => s.useAbsolute)

  const flowBody = flowSections.map(renderSection).join("\n    ")
  const absBody = absSections.map(renderSection).join("\n  ")

  // Collect needed Google Fonts
  const fonts = new Set<string>()
  fonts.add("IBM+Plex+Mono:wght@400;600")
  for (const s of sections) {
    const f = s.style.fontFamily ?? ""
    if (f.includes("Playfair")) fonts.add("Playfair+Display:wght@400;700")
    if (f.includes("Roboto")) fonts.add("Roboto:wght@400;700")
    if (f.includes("Montserrat")) fonts.add("Montserrat:wght@400;700")
    if (f.includes("Oswald")) fonts.add("Oswald:wght@400;700")
    if (f.includes("Bebas")) fonts.add("Bebas+Neue")
    if (f.includes("Space Mono")) fonts.add("Space+Mono:wght@400;700")
    if (f.includes("Press Start")) fonts.add("Press+Start+2P")
    if (f.includes("Pacifico")) fonts.add("Pacifico")
    if (f.includes("Dancing")) fonts.add("Dancing+Script:wght@400;700")
  }
  const fontLink = `https://fonts.googleapis.com/css2?family=${[...fonts].join("&family=")}&display=swap`

  // Paint strokes as fixed SVG overlay
  const paintSVG = (state.paintStrokes ?? []).length > 0 ? `
  <svg style="position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:999;" xmlns="http://www.w3.org/2000/svg">
    ${state.paintStrokes.map((stroke) => {
      if (stroke.points.length < 2) return ""
      const d = stroke.points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ")
      return `<path d="${d}" stroke="${stroke.color}" stroke-width="${stroke.size}" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`
    }).join("\n    ")}
  </svg>` : ""

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${siteConfig.name}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="${fontLink}" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { min-height: 100vh; background: ${globalStyles.background}; color: ${globalStyles.textColor}; font-family: ${globalStyles.fontFamily}; }
    .page { max-width: 680px; margin: 0 auto; padding: 2rem 0 6rem; position: relative; }
    a { color: inherit; }
    button { font-family: inherit; }
  </style>
</head>
<body>
  <div class="page">
    ${flowBody}
  </div>
  ${absBody}
  ${paintSVG}
</body>
</html>`
}