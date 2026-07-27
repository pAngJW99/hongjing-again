import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "再见，宏景｜火车站序章",
  description: "沿着盛夏的风，在宏景火车站开始一段像素旅程。",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
