"use client";

import { useTransition } from "react";
import {
  enableViewAsTeacher,
  disableViewAsTeacher,
} from "@/app/actions/view-as-actions";

export default function ViewAsTeacherToggle({
  viewingAsTeacher,
}: {
  viewingAsTeacher: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          if (viewingAsTeacher) {
            await disableViewAsTeacher();
          } else {
            await enableViewAsTeacher();
          }
        });
      }}
      className={`w-full rounded border px-3 py-1.5 text-center text-sm disabled:opacity-60 ${
        viewingAsTeacher
          ? "border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300 dark:hover:bg-amber-950/60"
          : "border-slate-300 text-slate-600 hover:bg-slate-100 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800"
      }`}
    >
      {pending
        ? "Switching..."
        : viewingAsTeacher
          ? "Viewing as teacher — switch back"
          : "View as teacher"}
    </button>
  );
}
