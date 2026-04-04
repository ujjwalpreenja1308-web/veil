// Metrics ingest — not yet implemented
import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ error: "Metrics ingest not yet supported" }, { status: 501 });
}
