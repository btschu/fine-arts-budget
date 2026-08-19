"use client";

import { useRef, useState, useTransition } from "react";
import { closeSchoolYear } from "@/app/actions/year-actions";
import { formatCurrency } from "@/lib/format";

export default function CloseYearForm({
  schoolId,
  currentLabel,
  endingBalance,
}: {
  schoolId: string;
  currentLabel: string;
  endingBalance: number;
}) {
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const [pendingFormData, setPendingFormData] = useState<FormData | null>(null);
  const [newLabel, setNewLabel] = useState("");

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
      >
        Close out {currentLabel} &amp; start a new year
      </button>
    );
  }

  if (pendingFormData) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/40">
        <p className="text-sm text-slate-700 dark:text-slate-300">
          Close out <strong>{currentLabel}</strong> and start{" "}
          <strong>&quot;{newLabel}&quot;</strong>? This can&apos;t be undone
          from here.
        </p>
        {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              setError(null);
              startTransition(async () => {
                try {
                  await closeSchoolYear(schoolId, pendingFormData);
                  setOpen(false);
                  setPendingFormData(null);
                } catch (err) {
                  setError(
                    err instanceof Error ? err.message : "Something went wrong."
                  );
                }
              });
            }}
            className="rounded bg-amber-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-60 dark:bg-amber-700 dark:hover:bg-amber-600"
          >
            {pending ? "Closing..." : "Yes, close year"}
          </button>
          <button
            type="button"
            onClick={() => setPendingFormData(null)}
            className="rounded border border-slate-300 px-4 py-1.5 text-sm text-slate-600 hover:bg-white dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/40">
      <h3 className="font-medium text-slate-900 dark:text-slate-100">
        Close out {currentLabel}
      </h3>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
        This locks {currentLabel} as a read-only, printable record and starts
        a new active school year with the ending balance (
        {formatCurrency(endingBalance)}) carried over as the new starting
        balance. Nothing is deleted.
      </p>
      <form
        ref={formRef}
        action={(formData) => {
          setError(null);
          setNewLabel(String(formData.get("newLabel") ?? ""));
          setPendingFormData(formData);
        }}
        className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end"
      >
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
            New school year name
          </label>
          <input
            name="newLabel"
            type="text"
            placeholder="2027-2028"
            required
            className="rounded border border-slate-300 px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
            New starting balance (optional override)
          </label>
          <input
            name="newStartingBalance"
            type="number"
            step="0.01"
            placeholder={endingBalance.toFixed(2)}
            className="rounded border border-slate-300 px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            className="rounded bg-amber-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-amber-700 dark:bg-amber-700 dark:hover:bg-amber-600"
          >
            Close year
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded border border-slate-300 px-4 py-1.5 text-sm text-slate-600 hover:bg-white dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
        </div>
      </form>
      {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
