const SERPAPI_URL = "https://serpapi.com/search.json"

// Only cache successful results — never cache failures
const cache = new Map<string, string>()

async function fetchImage(keyword: string): Promise<string | null> {
  if (cache.has(keyword)) {
    console.log(`[images] Cache hit for: "${keyword}"`)
    return cache.get(keyword)!
  }

  try {
    const params = new URLSearchParams({
      engine: "google_images",
      q: keyword,
      num: "5",
      safe: "active",
      api_key: process.env.SERPAPI_KEY ?? "",
    })

    const url = `${SERPAPI_URL}?${params}`
    console.log(`[images] Calling SerpApi for: "${keyword}"`)

    const res = await fetch(url)

    if (!res.ok) {
      const text = await res.text()
      console.error(`[images] SerpApi HTTP ${res.status}:`, text.slice(0, 200))
      return null
    }

    const data = await res.json()

    if (data.error) {
      console.error(`[images] SerpApi error:`, data.error)
      return null
    }

    const results = data.images_results ?? []
    console.log(`[images] Got ${results.length} results for: "${keyword}"`)

    for (const result of results) {
      const imageUrl = result.original ?? result.thumbnail
      if (imageUrl && imageUrl.startsWith("http")) {
        cache.set(keyword, imageUrl)
        return imageUrl
      }
    }

    console.warn(`[images] No usable image found for: "${keyword}"`)
    return null
  } catch (err) {
    console.error("[images] Fetch exception:", err)
    return null
  }
}

function extractKeyword(src: string, alt: string): string {
  // Try URL query params
  try {
    const url = new URL(src)
    const q = url.searchParams.get("q") ??
              url.searchParams.get("query") ??
              url.searchParams.get("random")
    if (q && q.length > 2 && !/^\d+$/.test(q)) return q
  } catch {}

  // Try unsplash-style path keywords
  const unsplashMatch = src.match(/unsplash\.com\/.*?[/?]([a-z-]+)/i)
  if (unsplashMatch) return unsplashMatch[1].replace(/-/g, " ")

  // Fall back to alt text
  if (alt && alt.length > 2) {
    const cleaned = alt
      .replace(/^(a |an |the |photo of |image of |picture of )/gi, "")
      .replace(/['"]/g, "")
      .trim()
      .slice(0, 60)
    if (cleaned.length > 2) return cleaned
  }

  return "abstract background"
}

function isPlaceholderSrc(src: string): boolean {
  return (
    src.includes("picsum.photos") ||
    src.includes("placeholder.com") ||
    src.includes("via.placeholder") ||
    src.includes("placehold.it") ||
    src.includes("source.unsplash.com") ||
    src.includes("loremflickr") ||
    src.includes("dummyimage")
  )
}

export async function swapImages(html: string): Promise<string> {
  const imgRegex = /<img([^>]*?)>/gi
  const matches = [...html.matchAll(imgRegex)]

  if (matches.length === 0) {
    console.log("[images] No img tags found")
    return html
  }

  console.log(`[images] Found ${matches.length} img tag(s)`)
  let result = html

  for (const match of matches) {
    const imgTag = match[0]
    const attrs = match[1]

    const srcMatch = attrs.match(/src=["']([^"']+)["']/)
    if (!srcMatch) continue

    const src = srcMatch[1]
    if (!isPlaceholderSrc(src)) continue

    const altMatch = attrs.match(/alt=["']([^"']*?)["']/)
    const alt = altMatch ? altMatch[1] : ""
    const keyword = extractKeyword(src, alt)

    const imageUrl = await fetchImage(keyword)
    if (!imageUrl) continue

    const newImgTag = imgTag.replace(srcMatch[0], `src="${imageUrl}"`)
    result = result.replace(imgTag, newImgTag)
    console.log(`[images] Swapped image for: "${keyword}"`)
  }

  return result
}