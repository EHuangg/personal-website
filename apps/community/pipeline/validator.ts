const BLOCKED_TAGS = ["object", "base", "video", "audio"]

function wrapIframes(html: string): string {
  let index = 0
  return html.replace(
    /<iframe([^>]*?)src=["']([^"']+)["']([^>]*?)(?:\/>|><\/iframe>)/gi,
    (_match, _before, src, _after) => {
      const id = `iframe-wrap-${index++}`
      const domain = (() => {
        try { return new URL(src).hostname } catch { return src }
      })()
      const escapedSrc = src.replace(/"/g, "&quot;")
      return `<div id="${id}" style="position:relative;width:100%;padding-bottom:56.25%;background:#1a1a1a;font-family:monospace;">
  <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff;gap:1rem;padding:1rem;text-align:center;">
    <p style="font-size:0.8rem;opacity:0.6;margin:0;">this embed was added by a visitor, not evan huang</p>
    <p style="font-size:0.9rem;margin:0;">external content from <strong>${domain}</strong></p>
    <a href="#" data-iframe-src="${escapedSrc}" data-iframe-target="${id}" style="font-family:monospace;font-size:0.85rem;padding:0.5rem 1.2rem;background:#fff;color:#111;text-decoration:none;display:inline-block;" onclick="(function(el){var wrap=document.getElementById(el.getAttribute('data-iframe-target'));var f=document.createElement('iframe');f.src=el.getAttribute('data-iframe-src');f.style='position:absolute;inset:0;width:100%;height:100%;border:none;';f.allowFullscreen=true;wrap.innerHTML='';wrap.appendChild(f);return false;})(this);return false;">load embed →</a>
  </div>
</div>`
    }
  )
}

export function validateAndClean(html: string): string {
  let cleaned = html

  // Strip markdown fences
  cleaned = cleaned.replace(/```html\n?/gi, "").replace(/```\n?/g, "").trim()

  // Remove blocked tags
  for (const tag of BLOCKED_TAGS) {
    const pattern = new RegExp(`<${tag}[^>]*>[\\s\\S]*?<\\/${tag}>`, "gi")
    const selfClosing = new RegExp(`<${tag}[^>]*/?>`, "gi")
    cleaned = cleaned.replace(pattern, "")
    cleaned = cleaned.replace(selfClosing, "")
  }

  // Remove on* event handlers (except our injected iframe ones)
  cleaned = cleaned.replace(/\s+on(?!click="[^"]*data-iframe)[a-z]+\s*=\s*["'][^"']*["']/gi, "")

  // Remove javascript: hrefs
  cleaned = cleaned.replace(/href\s*=\s*["']javascript:[^"']*["']/gi, 'href="#"')

  // Wrap iframes
  cleaned = wrapIframes(cleaned)

  if (cleaned.trim().length < 20) {
    throw new Error("Generated HTML is too short after cleaning")
  }

  return cleaned.trim()
}