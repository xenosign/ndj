import type { Metadata } from "next";
import "./globals.css";
import BottomNav from "@/components/layout/BottomNav";

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
        <div id="mobile-frame">
          {children}
          <BottomNav />
        </div>
      </body>
    </html>
  );
}
