import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { sendNotification } from "@/lib/firebase/admin";

// RLS 우회용 — 타 유저의 fcm_tokens 조회에 필요
const serviceSupabase = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const { targetUserId, title, body, url } = await req.json();
  if (!targetUserId || !title || !body)
    return NextResponse.json({ error: "missing fields" }, { status: 400 });

  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  if (user.id === targetUserId) return NextResponse.json({ ok: true });

  // DB에 알림 저장 — service role로 타 유저 row INSERT (RLS 우회)
  await serviceSupabase.from("notifications").insert({
    user_id: targetUserId,
    title,
    body,
    url: url ?? "/notifications",
  });

  // FCM 푸시 발송 — service role로 타 유저 토큰 조회 (RLS 우회)
  const { data: tokenRows } = await serviceSupabase
    .from("fcm_tokens")
    .select("token")
    .eq("user_id", targetUserId);

  console.log(`[notify] targetUserId=${targetUserId} tokenCount=${tokenRows?.length ?? 0}`);

  let fcmSent = 0;
  let fcmFailed = 0;

  if (tokenRows && tokenRows.length > 0) {
    const expiredTokens: string[] = [];
    await Promise.all(
      tokenRows.map(async ({ token }) => {
        try {
          await sendNotification({ token, title, body, url: url ?? "/notifications" });
          fcmSent++;
        } catch (error: unknown) {
          fcmFailed++;
          const code = (error as { errorInfo?: { code?: string } })?.errorInfo?.code ?? "";
          if (
            code === "messaging/registration-token-not-registered" ||
            code === "messaging/invalid-registration-token"
          ) {
            expiredTokens.push(token);
          } else {
            console.error("[notify] FCM 발송 실패:", error);
          }
        }
      })
    );
    if (expiredTokens.length > 0) {
      await serviceSupabase.from("fcm_tokens").delete().in("token", expiredTokens);
    }
  }

  console.log(`[notify] tokens=${tokenRows?.length ?? 0} sent=${fcmSent} failed=${fcmFailed}`);
  return NextResponse.json({ ok: true, fcmSent, fcmFailed });
}
