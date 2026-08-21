import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { auth } from "@/auth";
import { getMySchools, isAdmin, isViewingAsTeacher } from "@/lib/authz";
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

const THEME_INIT_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem("theme");
    var isDark =
      stored === "dark" ||
      (stored !== "light" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", isDark);
  } catch (e) {}
})();
`;

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const session = await auth();
  const schools = session?.user?.id ? await getMySchools(session.user.id) : [];
  const admin = session?.user?.id ? await isAdmin(session.user.id) : false;
  const viewingAsTeacher = await isViewingAsTeacher();

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-full bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        {session?.user ? (
          <AppShell
            userName={session.user.name ?? session.user.email ?? "Account"}
            schools={schools.map((s) => ({ id: s.id, name: s.name }))}
            admin={admin}
            viewingAsTeacher={viewingAsTeacher}
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
