import { NextRequest, NextResponse } from "next/server"
import { createHash } from "crypto"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

function sbFetch(path: string, opts?: RequestInit) {
  return fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    ...opts,
    headers: {
      "apikey": SUPABASE_ANON_KEY,
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
      "Prefer": "return=representation",
      ...opts?.headers,
    },
  })
}

function getDeviceHash(deviceId: string): string {
  return createHash("sha256").update(deviceId).digest("hex")
}

function getFallbackDeviceId(req: NextRequest): string {
  const ua = req.headers.get("user-agent") ?? ""
  const chUa = req.headers.get("sec-ch-ua") ?? ""
  const chMobile = req.headers.get("sec-ch-ua-mobile") ?? ""
  const chPlatform = req.headers.get("sec-ch-ua-platform") ?? ""
  const lang = req.headers.get("accept-language") ?? ""
  return `${ua}|${chUa}|${chMobile}|${chPlatform}|${lang}`
}

// GET — fetch all pins
export async function GET() {
  const res = await sbFetch("/visitor_pins?select=id,lat,lng,pixel_art,created_at&order=created_at.asc")
  const data = await res.json()
  return NextResponse.json(data)
}

// POST — submit a pin
export async function POST(req: NextRequest) {
  const { lat, lng, pixel_art, device_id } = await req.json()

  if (typeof lat !== "number" || typeof lng !== "number" || !pixel_art) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 })
  }

  const cookieDeviceId = req.cookies.get("visitor_device_id")?.value
  const rawDeviceId = (typeof device_id === "string" && device_id.trim()) || cookieDeviceId || getFallbackDeviceId(req)

  const ownerHash = getDeviceHash(rawDeviceId)
  console.log("[visitor-pins] POST", { lat, lng, device_hash: ownerHash.slice(0, 8), supabase_url: !!SUPABASE_URL, anon_key: !!SUPABASE_ANON_KEY })

  // We store device hash in ip_hash to avoid schema changes while enforcing one-pin-per-device.
  const check = await sbFetch(`/visitor_pins?ip_hash=eq.${ownerHash}&select=id`)
  const existing = await check.json()
  if (existing?.length > 0) {
    return NextResponse.json({ error: "You already have a pin. Remove it first." }, { status: 409 })
  }

  const res = await sbFetch("/visitor_pins", {
    method: "POST",
    body: JSON.stringify({ lat, lng, pixel_art, ip_hash: ownerHash }),
  })

  if (!res.ok) {
    const err = await res.json()
    console.error("[visitor-pins] Supabase error:", err)
    return NextResponse.json({ error: JSON.stringify(err) }, { status: 500 })
  }

  const data = await res.json()
  return NextResponse.json(data[0])
}

// DELETE — remove own pin by ID
export async function DELETE(req: NextRequest) {
  const { id } = await req.json().catch(() => ({ id: null }))
  if (!id) return NextResponse.json({ error: "Missing pin ID" }, { status: 400 })

  console.log("[visitor-pins] DELETE id:", id)
  const res = await sbFetch(`/visitor_pins?id=eq.${id}`, {
    method: "DELETE",
    headers: { "Prefer": "" },
  })
  if (!res.ok) {
    const err = await res.text()
    console.error("[visitor-pins] DELETE error:", err)
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 })
  }
  return NextResponse.json({ success: true })
}