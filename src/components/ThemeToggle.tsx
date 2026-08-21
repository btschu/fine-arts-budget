"use client";

import { useEffect, useState } from "react";

type ThemeSetting = "light" | "dark" | "system";

function applyTheme(setting: ThemeSetting) {
  const isDark =
    setting === "dark" ||
    (setting === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", isDark);
}

export default function ThemeToggle() {
  const [setting, setSetting] = useState<ThemeSetting>("system");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Reads localStorage after mount to avoid a server/client hydration
    // mismatch, since the stored preference isn't available during SSR.
    const stored = localStorage.getItem("theme") as ThemeSetting | null;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSetting(stored ?? "system");
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    applyTheme(setting);
    if (setting === "system") {
      localStorage.removeItem("theme");
    } else {
      localStorage.setItem("theme", setting);
    }
  }, [setting, mounted]);

  useEffect(() => {
    if (setting !== "system") return;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyTheme("system");
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [setting]);

  const options: { value: ThemeSetting; label: string }[] = [
    { value: "light", label: "Light" },
    { value: "dark", label: "Dark" },
    { value: "system", label: "System" },
  ];

  return (
    <div
      className="flex rounded-md border border-slate-300 p-0.5 text-xs dark:border-neutral-700"
      style={{ visibility: mounted ? "visible" : "hidden" }}
    >
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => setSetting(opt.value)}
          className={`flex-1 rounded px-2 py-1 font-medium ${
            setting === opt.value
              ? "bg-red-800 text-white"
              : "text-slate-600 hover:bg-slate-200 dark:text-neutral-400 dark:hover:bg-neutral-800"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
