"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

interface Notification {
  id: string;
  title: string;
  body: string;
  url: string | null;
  is_read: boolean;
  created_at: string;
}

function formatDate(iso: string) {
  const diffMin = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (diffMin < 1) return "방금 전";
  if (diffMin < 60) return `${diffMin}분 전`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}시간 전`;
  return `${Math.floor(diffHour / 24)}일 전`;
}

export default function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null);

  useEffect(() => {
    const supabase = createClient();

    async function fetchUnread() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { count } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_read", false);

      setUnreadCount(count ?? 0);

      channelRef.current = supabase
        .channel("notification-bell")
        .on("postgres_changes", {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        }, () => setUnreadCount((v) => v + 1))
        .subscribe();
    }

    fetchUnread();
    return () => { channelRef.current?.unsubscribe(); };
  }, []);

  async function handleOpen() {
    if (open) { setOpen(false); return; }
    setOpen(true);
    setLoading(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data } = await supabase
      .from("notifications")
      .select("id, title, body, url, is_read, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(30);

    setNotifications(data ?? []);
    setLoading(false);

    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user.id)
      .eq("is_read", false);

    setUnreadCount(0);
  }

  function handleNotificationClick(url: string | null) {
    setOpen(false);
    if (url) window.location.href = url;
  }

  return (
    <>
      {/* 벨 버튼 */}
      <button
        onClick={handleOpen}
        className="absolute z-40 flex items-center justify-center"
        style={{ top: 14, right: 16 }}
        aria-label="알림"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#A67FD4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        {unreadCount > 0 && (
          <span
            className="absolute -top-1 -right-1 min-w-[16px] h-4 rounded-full text-[10px] font-bold flex items-center justify-center px-1"
            style={{ backgroundColor: "#7B4DBE", color: "#F8F4FF" }}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* 바깥 클릭 닫기 */}
      {open && (
        <div
          className="absolute inset-0 z-40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* 드롭다운 */}
      {open && (
        <div
          className="absolute z-50 right-3 rounded-2xl flex flex-col overflow-hidden"
          style={{
            top: 56,
            width: "calc(100% - 24px)",
            maxHeight: "65dvh",
            backgroundColor: "#F8F4FF",
            border: "1px solid #D4C0F0",
            boxShadow: "0 8px 32px rgba(123,77,190,0.32)",
          }}
        >
          {/* 헤더 */}
          <div
            className="px-4 py-3 shrink-0 border-b"
            style={{ borderColor: "#D4C0F0" }}
          >
            <p className="text-sm font-bold" style={{ color: "#1A0A3D" }}>알림</p>
          </div>

          {/* 목록 */}
          <div className="overflow-y-auto flex flex-col">
            {loading ? (
              <p className="text-sm text-center py-8" style={{ color: "#A67FD4" }}>불러오는 중...</p>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10">
                <span className="text-3xl">🔔</span>
                <p className="text-sm" style={{ color: "#A67FD4" }}>아직 알림이 없습니다.</p>
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleNotificationClick(n.url)}
                  className="flex items-start gap-3 px-4 py-3 text-left w-full transition-opacity active:opacity-70 border-b"
                  style={{
                    backgroundColor: n.is_read ? "transparent" : "#EDE0FF",
                    borderColor: "#D4C0F0",
                  }}
                >
                  <div
                    className="shrink-0 w-2 h-2 rounded-full mt-1.5"
                    style={{ backgroundColor: n.is_read ? "transparent" : "#7B4DBE" }}
                  />
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <p className="text-xs font-bold" style={{ color: "#1A0A3D" }}>{n.title}</p>
                    <p className="text-xs leading-snug" style={{ color: "#A67FD4" }}>{n.body}</p>
                    <p className="text-xs mt-0.5" style={{ color: "#C4A0E8" }}>{formatDate(n.created_at)}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </>
  );
}
