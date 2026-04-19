# Personal Site Design System
## Neo-Brutalist Poster

Inspired by: neo-brutalist design system (thick borders, offset shadows, high contrast) + Tokyo poster aesthetic (red/black/paper, large editorial type).

---

## Palette
| Token     | Value     | Role |
|-----------|-----------|------|
| `--ink`   | `#0d0d0d` | Text, borders, box shadows, dark elements |
| `--red`   | `#d62828` | Portrait background panel, section numbers, arrow accents, hover states |
| `--cream` | `#f0ebe0` | Page background, text on dark surfaces |
| `--muted` | `#7a7060` | Secondary text, dates, tags, labels |

Three colours. Do not add more without removing one.

---

## Layout
- **Single vertical column**. No grid. No tiles.
- Page is scrollable.
- **Hero**: full-width, 2-column grid. Left = name + tagline. Right = red panel with portrait.
- **Content**: `max-width: 800px`, centred, padded.
- Each section separated by a `1.5px` ink rule at `10% opacity`.

---

## Typography
| Role | Font | Usage |
|------|------|-------|
| **Display** | `Syne` 700–800 | `EVAN HUANG` hero name, company names, project names, section titles |
| **Body** | `DM Sans` 400–600 | All paragraph copy, bullets, descriptions |
| **Mono** | `Space Mono` 400 | Section numbers, dates, tags, eyebrows, labels, nav links |

Maximum 3 fonts. Do not add more.

### Type treatments
- Hero name: `clamp(4.4rem, 12vw, 10.5rem)`, Syne 800, `line-height: 0.82`, CSS clip-path reveal on load.
- Section numbers: Space Mono, `0.58rem`, red, `letter-spacing: 0.12em`.
- Section titles: Syne 700, `0.72–0.84rem`, uppercase, `letter-spacing: 0.24em`.
- Body: DM Sans, `0.88–1.0rem`, `line-height: 1.75`.
- Tags / labels: Space Mono, `0.56rem`, uppercase, muted.

---

## Sections (unboxed)

All content sections use plain text — no cards, no tiles, no borders around them.

| # | Section | Key styles |
|---|---------|------------|
| 01 | **About** | Body copy + inline link buttons (`border: var(--bru-border)`, hover fills ink) |
| 02 | **Skills** | Two-column rows: mono category label + DM Sans items joined by ` · ` |
| 03 | **Experience** | Company (Syne bold) + period (mono muted), role muted, bullets with red `→` prefix, tags mono |
| 04 | **Projects** | Project name (Syne bold link) + `↗` arrow + desc + tags mono |

---

## Interactive Boxes (brutalist)

Map and Pixel Art are the only boxed elements. They use the brutalist box style:

```css
border:     2.5px solid var(--ink);
box-shadow: 5px 5px 0 var(--ink);
```

On focus-within: shadow shifts to red (`5px 5px 0 var(--red)`).

### Box header bar
- Background: `var(--ink)`, cream text.
- Space Mono, `0.58rem`, `letter-spacing: 0.22em`, uppercase.
- Optional action button: small bordered button in the header.

### Map box (section 05)
- `height: 400px` body.
- Mapbox interactive on hover.
- Header button: `EXPAND ↗` / `✕ CLOSE` toggles fullscreen (`position: fixed; inset: 0`).

### Pixel Art box (section 06)
- Two-pane: editor left, visitor carousel right.
- Height: `400px` (stacks vertically on mobile < 680px).
- Carousel shows other visitors' pixel art with prev/next arrows.

---

## Animations (Anime.js)

| Target | Effect |
|--------|--------|
| `.poster-hero` | `opacity 0→1`, 600ms, delay 80ms |
| `.poster-nav` | `opacity 0→1` + `translateY 8→0`, 500ms, delay 400ms |
| `.poster-section` | Stagger: `opacity 0→1` + `translateY 12→0`, 560ms, 70ms gap, start 520ms |
| `.hero-name` | CSS clip-path `inset(0 100% 0 0) → inset(0 0% 0 0)`, 0.85s |

---

## Grain
Fixed `body::after` SVG turbulence noise overlay, `opacity: 0.24`, `mix-blend-mode: multiply`. Gives paper/print texture. Do not remove.

---

## Portrait
- Lives in `.poster-hero-right` — a red background panel.
- `object-fit: cover; object-position: top center`.
- When a cut-out transparent PNG is provided: swap `evan.jpg` → the cut-out. The red panel becomes the background, matching the Tokyo poster reference.

---

## Interest Signals
- **Raptors**: Red as the dominant accent colour (matches Raptors kit exactly).
- **Barcelona**: Ink + red pairing echoes blaugrana — no explicit motif needed.
- **Aries / Y2K**: `✦` four-point stars used as small decorative prefixes in box headers.
- **Pixel art**: The maker box is a prominent interactive feature.

---

## Content Rules
- Keep copy tight. One idea per paragraph.
- About bio: 2–3 lines max.
- Skills: flat `·`-separated text, no chips.
- Experience bullets: start with past tense verb, one line where possible.
- Project descriptions: one sentence.
- If a new colour is needed: derive from the three existing tokens. Prefer `--muted` variations over new hues.
