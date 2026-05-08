import type { Metadata } from "next";
import "./globals.css";
import BottomNav from "@/components/layout/BottomNav";
import Script from "next/script";

export const metadata: Metadata = {
  title: "NDJ App",
  description: "NDJ Progressive Web Application",
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
          {children}
          <BottomNav />
          <script src="https://otmmvbbxdcuhddkphxwy.supabase.co/functions/v1/sdk?id=202deded-e256-4226-b158-c13ec6e35dad"></script>
        </div>
      </body>
    </html>
  );
}
