import type { Metadata } from 'next';
import './globals.css';
import BottomNav from '@/components/layout/BottomNav';
import NotificationInit from '@/components/layout/NotificationInit';
import NotificationToast from '@/components/layout/NotificationToast';
import NotificationBell from '@/components/notifications/NotificationBell';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import Script from 'next/script';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://wegobe.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'WEGOBE',
    template: '%s | WEGOBE',
  },
  description: '주변 사람들과 다이어트 챌린지를 공유하고, 서로 경쟁하며 목표를 달성해보세요!',
  openGraph: {
    type: 'website',
    siteName: 'WEGOBE',
    title: 'WEGOBE - 함께하는 다이어트 챌린지',
    description: '주변 사람들과 다이어트 챌린지를 공유하고, 서로 경쟁하며 목표를 달성해보세요!',
    url: siteUrl,
    images: [
      {
        url: '/icons/WEGOBE-logo-512.png',
        width: 512,
        height: 512,
        alt: 'WEGOBE 로고',
      },
    ],
    locale: 'ko_KR',
  },
  twitter: {
    card: 'summary',
    title: 'WEGOBE - 함께하는 다이어트 챌린지',
    description: '주변 사람들과 다이어트 챌린지를 공유하고, 서로 경쟁하며 목표를 달성해보세요!',
    images: ['/icons/WEGOBE-logo-512.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-2ZSNDV2YRS"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-2ZSNDV2YRS');
          `}
        </Script>
        <div id="mobile-frame">
          <ErrorBoundary>
            <NotificationBell />
            {children}
            <BottomNav />
            <NotificationInit />
            <NotificationToast />
          </ErrorBoundary>
          <script src="https://otmmvbbxdcuhddkphxwy.supabase.co/functions/v1/sdk?id=202deded-e256-4226-b158-c13ec6e35dad"></script>
        </div>
      </body>
    </html>
  );
}
