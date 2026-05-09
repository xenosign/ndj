import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendNotification } from "@/lib/firebase/admin";

export async function POST(req: NextRequest) {
  const { targetUserId, title, body, url } = await req.json();
  if (!targetUserId || !title || !body)
    return NextResponse.json({ error: "missing fields" }, { status: 400 });

  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  if (user.id === targetUserId) return NextResponse.json({ ok: true });

  // DB에 알림 저장 (FCM 토큰 유무와 무관하게 항상)
  await supabase.from("notifications").insert({
    user_id: targetUserId,
    title,
    body,
    url: url ?? "/notifications",
  });

  // FCM 푸시 발송
  const { data: profile } = await supabase
    .from("profiles")
    .select("fcm_token")
    .eq("id", targetUserId)
    .single();

  if (profile?.fcm_token) {
    try {
      await sendNotification({ token: profile.fcm_token, title, body, url: url ?? "/notifications" });
    } catch (error) {
      console.error("[notify] FCM 발송 실패:", error);
    }
  }

  return NextResponse.json({ ok: true });
}
