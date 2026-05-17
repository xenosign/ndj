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
    .catch(() => {});
}
