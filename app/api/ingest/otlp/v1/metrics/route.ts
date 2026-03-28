// Metrics ingest — accept and discard (not used by Veil yet)
import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ status: "ok" });
}
