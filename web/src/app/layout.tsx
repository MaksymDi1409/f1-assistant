import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import SiteHeader from "@/components/SiteHeader";
import "./globals.css";
import { getCurrentUser } from "@/lib/auth/session";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "cyrillic"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "F1 Assistant",
    template: "%s · F1 Assistant",
  },
  description: "Помічник фаната Формули 1: календар, таблиці, пілоти та AI-чат",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const user = await getCurrentUser();

  return (
    <html
      lang="uk"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">
        <SiteHeader
          user={user ? { firstName: user.firstName, role: user.role } : null}
        />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}