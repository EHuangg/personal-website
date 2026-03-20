import { NextResponse } from "next/server"
import { runDailyBuild } from "@/pipeline/daily-build"

const CRON_SECRET = process.env.CRON_SECRET

export async function GET(req: Request) {
  if (process.env.NODE_ENV === "production") {
    const querySecret = new URL(req.url).searchParams.get("secret")
    if (querySecret !== CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  }

  const result = await runDailyBuild()
  return NextResponse.json(result, { status: result.success ? 200 : 500 })
}