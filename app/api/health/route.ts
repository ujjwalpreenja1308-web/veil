import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    // Lightweight DB ping — checks connectivity without a full table scan
    const { error } = await supabase.from("organizations").select("id").limit(1);
    if (error) {
      return NextResponse.json(
        { status: "degraded", db: "unreachable", error: error.message },
        { status: 503 }
      );
    }
    return NextResponse.json({ status: "ok", db: "connected" });
  } catch (err) {
    return NextResponse.json(
      { status: "error", error: String(err) },
      { status: 503 }
    );
  }
}
