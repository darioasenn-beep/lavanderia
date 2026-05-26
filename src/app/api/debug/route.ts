import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    admin_configured: !!process.env.ADMIN_PASSWORD,
    supabase_configured: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
  });
}
