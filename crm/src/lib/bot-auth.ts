import { NextRequest, NextResponse } from "next/server";

export function verifyBotApiKey(req: NextRequest): NextResponse | null {
  const authHeader = req.headers.get("authorization");
  const apiKey = authHeader?.replace("Bearer ", "");

  if (!apiKey || apiKey !== process.env.BOT_API_KEY) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  return null;
}