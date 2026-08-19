"use client";

import { useRef, useState, useTransition } from "react";
import { createSchool } from "@/app/actions/school-actions";

function defaultYearLabel() {
  const now = new Date();
  const year = now.getFullYear();
  // School year starts in the fall; before July, assume we're still in the
  // year that started last fall.
  const startYear = now.getMonth() >= 6 ? year : year - 1;
  return `${startYear}-${startYear + 1}`;
}

export default function AddSchoolForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      ref={formRef}
      action={(formData) => {
        setError(null);
        startTransition(async () => {
          try {
            await createSchool(formData);
            formRef.current?.reset();
          } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong.");
          }
        });
      }}
      className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
    >
      <h2 className="font-medium text-slate-900 dark:text-slate-100">Add a school</h2>
      <p className="text-xs text-slate-500 dark:text-slate-400">
        You&apos;ll be added to it automatically so you can manage it right
        away.
      </p>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
            School name
          </label>
          <input
            name="name"
            type="text"
            required
            placeholder="North Middle School"
            className="rounded border border-slate-300 px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
            School year
          </label>
          <input
            name="yearLabel"
            type="text"
            required
            defaultValue={defaultYearLabel()}
            className="rounded border border-slate-300 px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
            Starting balance
          </label>
          <input
            name="startingBalance"
            type="number"
            step="0.01"
            defaultValue={0}
            className="rounded border border-slate-300 px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>
      </div>
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="self-start rounded bg-red-800 px-4 py-1.5 text-sm font-medium text-white hover:bg-red-900 disabled:opacity-60"
      >
        {pending ? "Adding..." : "Add school"}
      </button>
    </form>
  );
}
