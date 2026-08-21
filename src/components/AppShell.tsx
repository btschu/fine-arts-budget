"use client";

import { useState } from "react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";

export default function AppShell({
  userName,
  schools,
  admin,
  viewingAsTeacher,
  children,
}: {
  userName: string;
  schools: { id: string; name: string }[];
  admin: boolean;
  viewingAsTeacher: boolean;
  children: React.ReactNode;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="min-h-screen lg:flex">
      {/* Desktop sidebar */}
      <aside className="no-print hidden lg:block lg:w-64 lg:shrink-0 lg:border-r lg:border-slate-200 dark:lg:border-slate-800">
        <div className="fixed h-screen w-64">
          <Sidebar
            userName={userName}
            schools={schools}
            admin={admin}
            viewingAsTeacher={viewingAsTeacher}
          />
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="no-print flex items-center justify-between border-b border-slate-200 bg-slate-100 px-4 py-3 lg:hidden dark:border-slate-800 dark:bg-slate-900">
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-slate-100"
        >
          <span
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-800 text-base font-bold text-white"
            aria-hidden
          >
            $
          </span>
          Backstage
        </Link>
        <button
          type="button"
          aria-label="Open menu"
          onClick={() => setDrawerOpen(true)}
          className="rounded p-2 text-slate-600 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-800"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      </div>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-slate-900/50 dark:bg-black/60"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-64 shadow-xl">
            <Sidebar
              userName={userName}
              schools={schools}
              admin={admin}
              viewingAsTeacher={viewingAsTeacher}
              onNavigate={() => setDrawerOpen(false)}
            />
          </div>
        </div>
      )}

      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
