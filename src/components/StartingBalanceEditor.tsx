"use client";

import { useState, useTransition } from "react";
import { updateStartingBalance } from "@/app/actions/expense-actions";
import { formatCurrency } from "@/lib/format";

export default function StartingBalanceEditor({
  schoolYearId,
  startingBalance,
}: {
  schoolYearId: string;
  startingBalance: number;
}) {
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!editing) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <span className="text-slate-500 dark:text-neutral-400">
          Starting balance: {formatCurrency(startingBalance)}
        </span>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="rounded border border-slate-300 px-2 py-0.5 text-xs text-slate-600 hover:bg-slate-50 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800"
        >
          Edit
        </button>
      </div>
    );
  }

  return (
    <form
      action={(formData) => {
        setError(null);
        startTransition(async () => {
          try {
            await updateStartingBalance(schoolYearId, formData);
            setEditing(false);
          } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong.");
          }
        });
      }}
      className="flex items-center gap-2 text-sm"
    >
      <span className="text-slate-500 dark:text-neutral-400">Starting balance:</span>
      <input
        name="startingBalance"
        type="number"
        step="0.01"
        defaultValue={startingBalance}
        className="w-28 rounded border border-slate-300 px-2 py-1 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-red-800 px-2 py-1 text-white hover:bg-red-900 disabled:opacity-60"
      >
        Save
      </button>
      <button
        type="button"
        onClick={() => setEditing(false)}
        className="rounded border border-slate-300 px-2 py-1 text-sm text-slate-600 hover:bg-slate-50 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800"
      >
        Cancel
      </button>
      {error && <span className="text-red-600 dark:text-red-400">{error}</span>}
    </form>
  );
}
