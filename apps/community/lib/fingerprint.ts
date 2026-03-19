// Runs server-side: fingerprint from IP + user-agent
export function getServerFingerprint(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for")
  const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown"
  const ua = req.headers.get("user-agent") ?? "unknown"

  // Simple hash — not cryptographic, just needs to be consistent
  const raw = `${ip}:${ua}`
  let hash = 0
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash
  }
  return Math.abs(hash).toString(36)
}