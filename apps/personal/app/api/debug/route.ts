import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    has_supabase_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    has_anon_key: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    url_prefix: process.env.NEXT_PUBLIC_SUPABASE_URL?.slice(0, 30),
  })
}