"use client";

import { useTransition } from "react";
import { setAdmin } from "@/app/actions/user-actions";

export default function AdminToggle({
  userId,
  isAdmin,
}: {
  userId: string;
  isAdmin: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <label className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-neutral-400">
      <input
        type="checkbox"
        defaultChecked={isAdmin}
        disabled={pending}
        onChange={(e) => {
          const checked = e.target.checked;
          startTransition(async () => {
            await setAdmin(userId, checked);
          });
        }}
      />
      Admin
    </label>
  );
}
