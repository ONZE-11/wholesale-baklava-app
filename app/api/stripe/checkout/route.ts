import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "This checkout endpoint has been retired" },
    { status: 410 }
  );
}