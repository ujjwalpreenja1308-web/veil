import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const alerts = {
    email: !!process.env.RESEND_API_KEY,
    slack: !!process.env.COMPOSIO_API_KEY,
  };

  try {
    // Lightweight DB ping — checks connectivity without a full table scan
    const { error } = await supabase.from("organizations").select("id").limit(1);
    if (error) {
      return NextResponse.json(
        { status: "degraded", db: "unreachable", alerts, error: error.message },
        { status: 503 }
      );
    }
    return NextResponse.json({ status: "ok", db: "connected", alerts });
  } catch (err) {
    return NextResponse.json(
      { status: "error", alerts, error: String(err) },
      { status: 503 }
    );
  }
}
