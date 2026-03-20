const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages"
const OLLAMA_URL = process.env.OLLAMA_URL ?? "http://localhost:11434"

const USE_ANTHROPIC = !!process.env.ANTHROPIC_API_KEY
const USE_GROQ = !!process.env.GROQ_API_KEY

// ── Groq — used for interpreter + verifier (fast, free, small model) ──────────

async function callGroq(
  messages: { role: string; content: string }[],
  options: { model?: string; temperature?: number; max_tokens?: number } = {}
): Promise<string> {
  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: options.model ?? "llama-3.1-8b-instant",
      messages,
      temperature: options.temperature ?? 0.2,
      max_tokens: options.max_tokens ?? 1000,
    }),
  })
  if (!res.ok) throw new Error(`Groq error: ${res.status} ${await res.text()}`)
  const data = await res.json()
  return data.choices?.[0]?.message?.content ?? ""
}

// ── Anthropic — used for generator (high quality HTML) ───────────────────────

async function callAnthropic(
  system: string,
  userMessage: string,
  options: { temperature?: number; max_tokens?: number } = {}
): Promise<string> {
  const res = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY ?? "",
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-5",
      max_tokens: options.max_tokens ?? 8000,
      temperature: options.temperature ?? 0.7,
      system,
      messages: [{ role: "user", content: userMessage }],
    }),
  })
  if (!res.ok) throw new Error(`Anthropic error: ${res.status} ${await res.text()}`)
  const data = await res.json()
  return data.content?.[0]?.text ?? ""
}

// ── Ollama — fallback if no cloud keys ───────────────────────────────────────

async function callOllama(
  messages: { role: string; content: string }[],
): Promise<string> {
  const res = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: process.env.OLLAMA_MODEL ?? "llama3.2",
      messages,
      stream: false,
    }),
  })
  if (!res.ok) throw new Error(`Ollama error: ${res.status} ${await res.text()}`)
  const data = await res.json()
  return data.message?.content ?? ""
}

// ── Types ─────────────────────────────────────────────────────────────────────

export type Brief = {
  intent: "restyle" | "addContent" | "removeContent" | "embed" | "reset" | "other"
  preserveExisting: boolean
  resetContext: boolean
  generatorInstruction: string
}

// ── Stage 1: Interpreter (Groq 8b — fast + free) ─────────────────────────────

export async function interpretPrompt(
  userPrompt: string,
  hasCurrentSite: boolean
): Promise<Brief> {
  const system = `You are a prompt interpreter for a website builder. Analyze the user's prompt and output a JSON brief. Output ONLY valid JSON, no markdown.

{
  "intent": "restyle" | "addContent" | "removeContent" | "embed" | "reset" | "other",
  "preserveExisting": boolean — true if the existing page should be kept as the base,
  "resetContext": boolean — true ONLY if user explicitly wants to start over completely,
  "generatorInstruction": string — rewrite the user prompt as a clear, specific, detailed instruction for an expert web designer. Be specific about visual style, layout, colors, typography, and interactions. Do not mention any header bar or navigation.
}

Guidelines:
- restyle = color/font/theme only → preserveExisting: true
- addContent = adding something new → preserveExisting: true
- removeContent = removing things → preserveExisting: true
- embed = adding YouTube/image → preserveExisting: true
- reset = start completely fresh → preserveExisting: false, resetContext: true
- If user says "remove everything" / "start over" / "blank" / "fresh" → reset
- generatorInstruction should be rich and detailed`

  const messages = [
    { role: "system", content: system },
    { role: "user", content: `User prompt: "${userPrompt}"\nHas existing site: ${hasCurrentSite}\n\nOutput JSON:` },
  ]

  try {
    const raw = USE_GROQ
      ? await callGroq(messages, { temperature: 0.2, max_tokens: 600 })
      : await callOllama(messages)
    const cleaned = raw.replace(/```json\n?/gi, "").replace(/```\n?/g, "").trim()
    return JSON.parse(cleaned) as Brief
  } catch {
    return {
      intent: "other",
      preserveExisting: hasCurrentSite,
      resetContext: false,
      generatorInstruction: userPrompt,
    }
  }
}

// ── Stage 2: Generator (Claude Sonnet — high quality) ────────────────────────

const GENERATOR_SYSTEM = `You are an elite UI/UX designer and frontend developer. You produce stunning, production-quality websites as complete self-contained HTML documents.

Output a COMPLETE valid HTML document with <!DOCTYPE html>, <html>, <head>, and <body>.
This renders in a full-page iframe — make it fill the entire viewport beautifully.

CRITICAL OUTPUT CONSTRAINT — PLAN BEFORE YOU WRITE:
Your entire output must be under 300 lines. Budget carefully:
- ~20 lines: DOCTYPE, html, head, meta, font links
- ~80 lines: CSS (use shorthand, combine selectors, CSS variables, no repetition)
- ~120 lines: HTML structure
- ~60 lines: JavaScript if needed
If a design needs more, simplify — prioritize visual impact over completeness.
Use CSS classes not inline styles. No redundant whitespace or comments.
Always end with </html> — never leave output incomplete.

DESIGN STANDARDS:
- Google Fonts via <link> — choose fonts that match the mood
- CSS custom properties (--color-*, --font-*, --spacing-*) for consistency
- CSS Grid and Flexbox used correctly
- Clear typography hierarchy: headings, subheadings, body
- Hover states, smooth transitions (200-300ms)
- Cohesive color palette, generous whitespace
- Must look like it was built by a senior designer at a top tech company

CAPABILITIES — use freely:
- <script> tags for animations, canvas, games, particle systems, simulations
- Libraries from cdnjs.cloudflare.com (Three.js, p5.js, GSAP, Chart.js, etc.)
- CSS animations, keyframes, transforms, filters, backdrop-blur
- Inline SVG icons and illustrations
- Images: <img src="https://picsum.photos/800/500" alt="KEYWORD"> with specific keywords like alt="messi football" or alt="tokyo skyline night"
- YouTube: <iframe src="https://www.youtube.com/embed/VIDEO_ID" frameborder="0" allowfullscreen></iframe>

HARD RULES:
- No <video> or <audio> tags
- No markdown fences — ONLY the raw HTML document

Respond with ONLY the complete HTML document. Nothing else.`

export async function generateHTML(brief: Brief, currentHTML: string | null): Promise<string> {
  const contextHTML = brief.preserveExisting && currentHTML
    ? currentHTML.slice(0, 6000) // trim to keep input tokens reasonable
    : null

  const contextSection = brief.preserveExisting && contextHTML
    ? `Current page HTML (preserve structure and content, apply only the requested changes):\n\`\`\`html\n${contextHTML}\n\`\`\`\n\n`
    : "This is a fresh start — create something entirely new.\n\n"

  const userMessage = `${contextSection}Design instruction: ${brief.generatorInstruction}\n\nGenerate the complete HTML document now. Make it exceptional.`

  if (USE_ANTHROPIC) {
    console.log("[pipeline] Using Claude Sonnet for generation")
    return callAnthropic(GENERATOR_SYSTEM, userMessage, { temperature: 0.7, max_tokens: 10000 })
  } else if (USE_GROQ) {
    console.log("[pipeline] Using Groq 70b for generation")
    return callGroq(
      [{ role: "system", content: GENERATOR_SYSTEM }, { role: "user", content: userMessage }],
      { model: "llama-3.3-70b-versatile", temperature: 0.7, max_tokens: 8000 }
    )
  } else {
    return callOllama([
      { role: "system", content: GENERATOR_SYSTEM },
      { role: "user", content: userMessage },
    ])
  }
}

// ── Stage 3: Verifier (Groq 8b — fast + free) ────────────────────────────────

const VERIFIER_SYSTEM = `You are an HTML quality verifier for a personal website builder.

Check the generated HTML against the brief:
1. Is it a complete valid HTML document (DOCTYPE, html, head, body)?
2. Does it match the intent?
3. Are there forbidden elements (video, audio)?
4. Is styling complete and cohesive?
5. For preserveExisting=true: does it keep existing content/structure?

Output ONLY valid JSON:
{
  "approved": boolean,
  "issues": string[],
  "fixInstruction": string
}`

export async function verifyHTML(
  brief: Brief,
  html: string
): Promise<{ approved: boolean; issues: string[]; fixInstruction: string }> {
  const messages = [
    { role: "system", content: VERIFIER_SYSTEM },
    { role: "user", content: `Brief:\n${JSON.stringify(brief, null, 2)}\n\nHTML (first 3000 chars):\n${html.slice(0, 3000)}\n\nVerify:` },
  ]

  try {
    const raw = USE_GROQ
      ? await callGroq(messages, { temperature: 0.1, max_tokens: 500 })
      : await callOllama(messages)
    const cleaned = raw.replace(/```json\n?/gi, "").replace(/```\n?/g, "").trim()
    return JSON.parse(cleaned)
  } catch {
    return { approved: true, issues: [], fixInstruction: "" }
  }
}

// ── Main entry point ──────────────────────────────────────────────────────────

export async function generatePageHTML(
  userPrompt: string,
  currentHTML: string | null
): Promise<string> {
  const brief = await interpretPrompt(userPrompt, !!currentHTML)
  console.log("[pipeline] Brief:", JSON.stringify(brief))

  const contextHTML = brief.resetContext ? null : currentHTML

  let html = await generateHTML(brief, contextHTML)
  console.log("[pipeline] Generated length:", html.length)

  // Completion check — if output was cut off, request completion
  const isComplete = html.trimEnd().endsWith("</html>")
  if (!isComplete) {
    console.log("[pipeline] Output incomplete — requesting completion")
    try {
      const completion = await callAnthropic(
        "You are completing an HTML document that was cut off. Output only the missing closing portion starting from where it was cut off. End with </html>.",
        `This HTML was cut off mid-generation. Complete it:\n\n${html.slice(-2000)}`,
        { temperature: 0.1, max_tokens: 2000 }
      )
      // Find where the cut happened and append the completion
      const lastTag = html.lastIndexOf("<")
      const safeBase = html.slice(0, lastTag)
      html = safeBase + completion.replace(/```html\n?/gi, "").replace(/```\n?/g, "").trim()
      console.log("[pipeline] Completion appended, new length:", html.length)
    } catch (err) {
      console.error("[pipeline] Completion failed:", err)
    }
  }

  // Verifier + retry loop (max 2 attempts) — only use for non-Anthropic
  // Claude's output quality is high enough that verification is usually unnecessary
  if (!USE_ANTHROPIC) {
    for (let attempt = 0; attempt < 2; attempt++) {
      const result = await verifyHTML(brief, html)
      console.log(`[pipeline] Verify ${attempt + 1}:`, result.approved, result.issues)
      if (result.approved) break
      if (result.fixInstruction) {
        html = await generateHTML(
          { ...brief, generatorInstruction: `${brief.generatorInstruction}\n\nFix: ${result.fixInstruction}` },
          contextHTML
        )
      } else break
    }
  }

  return html
}