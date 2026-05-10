import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import TopHeader from "@/components/layout/TopHeader";
import ScrollableArea from "@/components/layout/ScrollableArea";
import NotificationList from "@/components/notifications/NotificationList";

export default async function NotificationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: notifications } = await supabase
    .from("notifications")
    .select("id, title, body, url, is_read, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  // 페이지 진입 시 전체 읽음 처리
  await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", user.id)
    .eq("is_read", false);

  return (
    <main className="flex flex-1 flex-col" style={{ backgroundColor: "#1A0A3D" }}>
      <TopHeader title="알림" />
      <ScrollableArea>
        <NotificationList notifications={notifications ?? []} />
      </ScrollableArea>
    </main>
  );
}
