import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { MotionLayer } from "@/components/motion-layer";
import { LanguageProvider } from "@/components/language-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PEROT | 篮球鞋个性化推荐",
  description: "为你的场上风格，找到更适合的篮球鞋。",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="zh-CN"
      className={`${geistSans.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <LanguageProvider><SiteHeader />
        <main>{children}</main>
        <SiteFooter /><Suspense fallback={null}><MotionLayer /></Suspense></LanguageProvider>
      </body>
    </html>
  );
}
