import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// 카카오 로그아웃 후 리다이렉트되는 콜백
export async function GET(request: Request) {
  const { origin } = new URL(request.url);
  const supabase = await createClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(`${origin}/login`);
}
