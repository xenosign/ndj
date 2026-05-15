import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

// RLS 우회용 — diet_reactions에서 타 유저 반응 조회에 필요
const serviceSupabase = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const challengeId = searchParams.get("challengeId");
  const date = searchParams.get("date");

  if (!challengeId || !date) {
    return NextResponse.json({ error: "missing params" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  // 참여자 여부 확인 (RLS 우회 전 보안 체크)
  const { data: participant } = await supabase
    .from("diet_participants")
    .select("id")
    .eq("challenge_id", challengeId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!participant) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { data: reactions } = await serviceSupabase
    .from("diet_reactions")
    .select("user_id, reaction, created_at")
    .eq("challenge_id", challengeId)
    .eq("logged_date", date);

  return NextResponse.json({ reactions: reactions ?? [] });
}
