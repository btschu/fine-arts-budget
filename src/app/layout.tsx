import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { auth } from "@/auth";
import { getMySchools } from "@/lib/authz";
import AppShell from "@/components/AppShell";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Backstage",
  description: "Spending tracker for the fine arts department",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const session = await auth();
  const schools = session?.user?.id ? await getMySchools(session.user.id) : [];

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-slate-50 text-slate-900">
        {session?.user ? (
          <AppShell
            userName={session.user.name ?? session.user.email ?? "Account"}
            schools={schools.map((s) => ({ id: s.id, name: s.name }))}
          >
            {children}
          </AppShell>
        ) : (
          children
        )}
      </body>
    </html>
  );
}
