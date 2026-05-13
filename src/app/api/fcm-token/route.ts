import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const { token, deviceId } = await req.json();
  if (!token || !deviceId) return NextResponse.json({ error: "token and deviceId required" }, { status: 400 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { error } = await supabase
    .from("fcm_tokens")
    .upsert(
      { user_id: user.id, token, device_id: deviceId, updated_at: new Date().toISOString() },
      { onConflict: "user_id,device_id" }
    );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const { token } = await req.json();
  if (!token) return NextResponse.json({ error: "token required" }, { status: 400 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  await supabase.from("fcm_tokens").delete().eq("token", token).eq("user_id", user.id);

  return NextResponse.json({ ok: true });
}
