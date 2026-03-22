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

function getIpHash(req: NextRequest): string {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  return createHash("sha256").update(ip).digest("hex")
}

// GET — fetch all pins
export async function GET() {
  const res = await sbFetch("/visitor_pins?select=id,lat,lng,pixel_art,created_at&order=created_at.asc")
  const data = await res.json()
  return NextResponse.json(data)
}

// POST — submit a pin
export async function POST(req: NextRequest) {
  const { lat, lng, pixel_art } = await req.json()

  if (!lat || !lng || !pixel_art) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 })
  }

  const ip_hash = getIpHash(req)
  console.log("[visitor-pins] POST", { lat, lng, ip_hash: ip_hash.slice(0, 8), supabase_url: !!SUPABASE_URL, anon_key: !!SUPABASE_ANON_KEY })

  // Check for existing pin with this IP
  const check = await sbFetch(`/visitor_pins?ip_hash=eq.${ip_hash}&select=id`)
  const existing = await check.json()
  if (existing?.length > 0) {
    return NextResponse.json({ error: "You already have a pin. Remove it first." }, { status: 409 })
  }

  const res = await sbFetch("/visitor_pins", {
    method: "POST",
    body: JSON.stringify({ lat, lng, pixel_art, ip_hash }),
  })

  if (!res.ok) {
    const err = await res.json()
    console.error("[visitor-pins] Supabase error:", err)
    return NextResponse.json({ error: JSON.stringify(err) }, { status: 500 })
  }

  const data = await res.json()
  return NextResponse.json(data[0])
}

// DELETE — remove own pin
export async function DELETE(req: NextRequest) {
  const ip_hash = getIpHash(req)
  const res = await sbFetch(`/visitor_pins?ip_hash=eq.${ip_hash}`, {
    method: "DELETE",
  })
  if (!res.ok) {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 })
  }
  return NextResponse.json({ success: true })
}