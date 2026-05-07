import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="ko" className="h-full">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
