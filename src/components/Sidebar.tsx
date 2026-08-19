"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOutAction } from "@/app/actions/auth-actions";

function NavLink({
  href,
  children,
  onNavigate,
}: {
  href: string;
  children: React.ReactNode;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(href + "/");

  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={`rounded-md px-3 py-2 text-sm font-medium ${
        active
          ? "bg-red-800 text-white"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
      }`}
    >
      {children}
    </Link>
  );
}

export default function Sidebar({
  userName,
  schools,
  onNavigate,
}: {
  userName: string;
  schools: { id: string; name: string }[];
  onNavigate?: () => void;
}) {
  return (
    <div className="flex h-full flex-col bg-white">
      <div className="px-4 py-5">
        <Link
          href="/"
          onClick={onNavigate}
          className="flex items-center gap-2 text-lg font-semibold text-slate-900"
        >
          <span
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-800 text-lg font-bold text-white"
            aria-hidden
          >
            $
          </span>
          Backstage
        </Link>
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3">
        <p className="mt-2 px-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Schools
        </p>
        {schools.map((school) => (
          <NavLink
            key={school.id}
            href={`/school/${school.id}`}
            onNavigate={onNavigate}
          >
            {school.name}
          </NavLink>
        ))}

        <p className="mt-4 px-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Account
        </p>
        <NavLink href="/settings" onNavigate={onNavigate}>
          Settings
        </NavLink>
      </nav>

      <div className="border-t border-slate-200 px-4 py-4">
        <p className="mb-2 truncate text-sm text-slate-600">{userName}</p>
        <form action={signOutAction}>
          <button
            type="submit"
            className="w-full rounded border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100"
          >
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}
