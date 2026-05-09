"use client";

import Link from "next/link";

interface Notification {
  id: string;
  title: string;
  body: string;
  url: string | null;
  is_read: boolean;
  created_at: string;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffMin = Math.floor((now.getTime() - d.getTime()) / 60000);
  if (diffMin < 1) return "방금 전";
  if (diffMin < 60) return `${diffMin}분 전`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}시간 전`;
  return `${Math.floor(diffHour / 24)}일 전`;
}

export default function NotificationList({ notifications }: { notifications: Notification[] }) {
  if (notifications.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 py-20">
        <span className="text-4xl">🔔</span>
        <p className="text-sm font-medium" style={{ color: "#E8D5B0" }}>
          아직 알림이 없습니다.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col px-4 py-4 gap-2">
      {notifications.map((n) => {
        const inner = (
          <div
            className="flex items-start gap-3 rounded-2xl px-4 py-4"
            style={{
              backgroundColor: n.is_read ? "#2C1A0E" : "#3D2510",
              border: `1px solid ${n.is_read ? "#3D2510" : "#7B4A2D"}`,
            }}
          >
            <div
              className="shrink-0 w-2 h-2 rounded-full mt-2"
              style={{ backgroundColor: n.is_read ? "transparent" : "#F2C14E" }}
            />
            <div className="flex flex-col gap-1 min-w-0">
              <p className="text-sm font-bold" style={{ color: "#F2C14E" }}>
                {n.title}
              </p>
              <p className="text-xs leading-snug" style={{ color: "#E8D5B0" }}>
                {n.body}
              </p>
              <p className="text-xs mt-1" style={{ color: "#7B4A2D" }}>
                {formatDate(n.created_at)}
              </p>
            </div>
          </div>
        );

        return n.url ? (
          <Link key={n.id} href={n.url}>
            {inner}
          </Link>
        ) : (
          <div key={n.id}>{inner}</div>
        );
      })}
    </div>
  );
}
