import { NextResponse } from "next/server"
import { runDailyBuild } from "@/pipeline/daily-build"

// Vercel cron calls this with a secret to prevent abuse
const CRON_SECRET = process.env.CRON_SECRET

export async function GET(req: Request) {
  // Verify secret in production
  if (process.env.NODE_ENV === "production") {
    const authHeader = req.headers.get("authorization")
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  }

  const result = await runDailyBuild()
  return NextResponse.json(result, { status: result.success ? 200 : 500 })
}