import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  let token: string | undefined;
  try {
    const text = await req.text();
    token = JSON.parse(text)?.token;
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  if (!token) return NextResponse.json({ error: "token required" }, { status: 400 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  await supabase.from("fcm_tokens").delete().eq("token", token).eq("user_id", user.id);

  return NextResponse.json({ ok: true });
}
