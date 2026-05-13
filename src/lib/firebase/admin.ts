import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";

function getAdminApp(): App {
  if (getApps().length > 0) return getApps()[0];

  return initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

export async function sendNotification({
  token,
  title,
  body,
  url,
}: {
  token: string;
  title: string;
  body: string;
  url?: string;
}) {
  const app = getAdminApp();
  const messaging = getMessaging(app);

  await messaging.send({
    token,
    notification: { title, body },
    data: { url: url ?? "/" },
    webpush: {
      notification: {
        icon: "/icons/WEGOBE-logo-192.png",
        badge: "/icons/WEGOBE-logo-192.png",
      },
      fcmOptions: { link: url ?? "/" },
    },
  });
}
