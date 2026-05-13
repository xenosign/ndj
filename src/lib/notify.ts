export function notifyUser({
  targetUserId,
  title,
  body,
  url,
}: {
  targetUserId: string;
  title: string;
  body: string;
  url?: string;
}) {
  fetch("/api/notify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ targetUserId, title, body, url }),
  })
    .then((res) => res.json().then((d) => {
      if (!res.ok) console.error("[notify] 실패:", res.status, d);
      else console.log("[notify] 결과:", d);
    }))
    .catch((e) => console.error("[notify] 네트워크 오류:", e));
}
