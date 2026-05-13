import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { level, prefix, message, data, userAgent } = body;

  if (!level || !message) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await supabase.from("mobile_logs").insert({
    user_id: user?.id ?? null,
    level,
    prefix,
    message,
    data: data ?? null,
    user_agent: userAgent ?? null,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
