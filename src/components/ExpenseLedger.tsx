"use client";

import { useMemo, useState, useTransition } from "react";
import { deleteExpense, updateExpense } from "@/app/actions/expense-actions";
import { formatCurrency, formatDate } from "@/lib/format";
import { compressImage } from "@/lib/compressImage";
import { ledgerRowsToCsv, downloadCsv } from "@/lib/csv";
import type { LedgerRow } from "@/lib/ledger";

export type { LedgerRow };

const VENDOR_LIST_ID = "ledger-vendor-suggestions";

export default function ExpenseLedger({
  schoolYearId,
  rows,
  readOnly = false,
  vendorSuggestions = [],
  exportFilename = "expenses.csv",
}: {
  schoolYearId: string;
  rows: LedgerRow[];
  readOnly?: boolean;
  vendorSuggestions?: string[];
  exportFilename?: string;
}) {
  const [query, setQuery] = useState("");

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (row) =>
        row.item.toLowerCase().includes(q) ||
        row.vendor.toLowerCase().includes(q) ||
        row.enteredByName.toLowerCase().includes(q) ||
        row.amount.toFixed(2).includes(q) ||
        formatCurrency(row.amount).toLowerCase().includes(q)
    );
  }, [rows, query]);

  if (rows.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
        No purchases logged yet.
      </p>
    );
  }

  return (
    <>
      <datalist id={VENDOR_LIST_ID}>
        {vendorSuggestions.map((v) => (
          <option key={v} value={v} />
        ))}
      </datalist>

      <div className="no-print mb-3 flex flex-wrap items-center gap-2">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search item, vendor, teacher, or amount…"
          className="min-w-0 flex-1 rounded border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        />
        <button
          type="button"
          onClick={() =>
            downloadCsv(exportFilename, ledgerRowsToCsv(filteredRows))
          }
          className="rounded border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
        >
          Export CSV
        </button>
      </div>

      {filteredRows.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
          No purchases match &quot;{query}&quot;.
        </p>
      ) : (
        <>
          {/* Mobile: stacked cards, no horizontal scroll */}
          <div className="flex flex-col gap-3 lg:hidden">
            {filteredRows.map((row) => (
              <ExpenseCard
                key={row.id}
                schoolYearId={schoolYearId}
                row={row}
                readOnly={readOnly}
              />
            ))}
          </div>

          {/* Desktop: table */}
          <div className="hidden rounded-lg border border-slate-200 bg-white shadow-sm lg:block dark:border-slate-800 dark:bg-slate-900">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-400">
                  <th className="px-4 py-2">Date</th>
                  <th className="px-4 py-2">Item</th>
                  <th className="px-4 py-2">Purchased from</th>
                  <th className="px-4 py-2">Entered by</th>
                  <th className="px-4 py-2 text-right">Amount</th>
                  <th className="px-4 py-2 text-right">Balance</th>
                  {!readOnly && <th className="px-4 py-2" />}
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => (
                  <ExpenseRow
                    key={row.id}
                    schoolYearId={schoolYearId}
                    row={row}
                    readOnly={readOnly}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}

function useEditableExpense(schoolYearId: string, row: LedgerRow) {
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deletePending, startDeleteTransition] = useTransition();

  async function save(formData: FormData) {
    setError(null);
    const receipt = formData.get("receipt");
    if (receipt instanceof File && receipt.size > 0) {
      formData.set("receipt", await compressImage(receipt));
    }
    startTransition(async () => {
      try {
        await updateExpense(row.id, schoolYearId, formData);
        setEditing(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  }

  function confirmDelete() {
    startDeleteTransition(async () => {
      await deleteExpense(row.id, schoolYearId);
    });
  }

  return {
    editing,
    setEditing,
    error,
    pending,
    save,
    confirmingDelete,
    setConfirmingDelete,
    deletePending,
    confirmDelete,
  };
}

function EditFields({ row }: { row: LedgerRow }) {
  return (
    <>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-slate-500 dark:text-slate-400">Purchased from</label>
        <input
          name="vendor"
          defaultValue={row.vendor}
          required
          list={VENDOR_LIST_ID}
          className="rounded border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-slate-500 dark:text-slate-400">Item</label>
        <input
          name="item"
          defaultValue={row.item}
          required
          className="rounded border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-slate-500 dark:text-slate-400">Cost</label>
        <input
          name="amount"
          type="number"
          step="0.01"
          min="0.01"
          defaultValue={row.amount}
          required
          className="w-full rounded border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-slate-500 dark:text-slate-400">Date of purchase</label>
        <input
          name="spentAt"
          type="date"
          defaultValue={row.spentAt.slice(0, 10)}
          className="rounded border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-slate-500 dark:text-slate-400">
          {row.hasReceipt ? "Replace receipt photo" : "Receipt photo"}
        </label>
        <input
          name="receipt"
          type="file"
          accept="image/*"
          className="text-xs text-slate-500 file:mr-2 file:rounded file:border-0 file:bg-slate-100 file:px-2 file:py-1 file:text-xs dark:text-slate-400 dark:file:bg-slate-800 dark:file:text-slate-300"
        />
      </div>
    </>
  );
}

function ReceiptLink({ id }: { id: string }) {
  return (
    <a
      href={`/api/receipts/${id}`}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className="inline-block rounded border border-slate-300 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
    >
      📎 Receipt
    </a>
  );
}

function ExpenseCard({
  schoolYearId,
  row,
  readOnly,
}: {
  schoolYearId: string;
  row: LedgerRow;
  readOnly: boolean;
}) {
  const {
    editing,
    setEditing,
    error,
    pending,
    save,
    confirmingDelete,
    setConfirmingDelete,
    deletePending,
    confirmDelete,
  } = useEditableExpense(schoolYearId, row);

  if (editing) {
    return (
      <form
        action={save}
        className="flex flex-col gap-3 rounded-lg border border-amber-200 bg-amber-50/40 p-4 dark:border-amber-900 dark:bg-amber-950/20"
      >
        <EditFields row={row} />
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="rounded border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={pending}
            className="rounded bg-red-800 px-3 py-1.5 text-sm text-white hover:bg-red-900 disabled:opacity-60"
          >
            Save
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-medium text-slate-900 dark:text-slate-100">{row.vendor}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {formatDate(row.spentAt)} · {row.item}
          </p>
        </div>
        <p className="whitespace-nowrap text-right font-semibold text-slate-900 dark:text-slate-100">
          {formatCurrency(row.amount)}
        </p>
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <span>
          {row.enteredByName}
          {row.updatedByName && <span> (edited by {row.updatedByName})</span>}
        </span>
        <span>Balance {formatCurrency(row.runningBalance)}</span>
      </div>
      {row.hasReceipt && (
        <div className="mt-2">
          <ReceiptLink id={row.id} />
        </div>
      )}
      {!readOnly &&
        (confirmingDelete ? (
          <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
            <span className="text-xs text-slate-600 dark:text-slate-400">Delete this purchase?</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmingDelete(false)}
                className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deletePending}
                onClick={confirmDelete}
                className="rounded bg-red-700 px-2 py-1 text-xs font-medium text-white hover:bg-red-800 disabled:opacity-60"
              >
                {deletePending ? "Deleting..." : "Yes, delete"}
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-3 flex justify-end gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => setConfirmingDelete(true)}
              className="rounded border border-red-300 px-2 py-1 text-xs text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/40"
            >
              Delete
            </button>
          </div>
        ))}
    </div>
  );
}

function ExpenseRow({
  schoolYearId,
  row,
  readOnly,
}: {
  schoolYearId: string;
  row: LedgerRow;
  readOnly: boolean;
}) {
  const {
    editing,
    setEditing,
    error,
    pending,
    save,
    confirmingDelete,
    setConfirmingDelete,
    deletePending,
    confirmDelete,
  } = useEditableExpense(schoolYearId, row);

  if (editing) {
    return (
      <tr className="border-b border-slate-100 bg-amber-50/40 dark:border-slate-800 dark:bg-amber-950/20">
        <td colSpan={7} className="px-4 py-3">
          <form action={save} className="flex flex-wrap items-end gap-3">
            <EditFields row={row} />
            <button
              type="submit"
              disabled={pending}
              className="rounded bg-red-800 px-3 py-1.5 text-sm text-white hover:bg-red-900 disabled:opacity-60"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            {error && <span className="text-sm text-red-600 dark:text-red-400">{error}</span>}
          </form>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-b border-slate-100 last:border-0 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/60">
      <td className="px-4 py-2 whitespace-nowrap text-slate-600 dark:text-slate-400">
        {formatDate(row.spentAt)}
      </td>
      <td className="px-4 py-2 text-slate-900 dark:text-slate-100">
        {row.item}
        {row.hasReceipt && (
          <div>
            <ReceiptLink id={row.id} />
          </div>
        )}
      </td>
      <td className="px-4 py-2 text-slate-600 dark:text-slate-400">{row.vendor}</td>
      <td className="px-4 py-2 text-slate-600 dark:text-slate-400">
        {row.enteredByName}
        {row.updatedByName && (
          <span className="text-xs text-slate-400 dark:text-slate-500"> (edited by {row.updatedByName})</span>
        )}
      </td>
      <td className="px-4 py-2 text-right text-slate-900 dark:text-slate-100">
        {formatCurrency(row.amount)}
      </td>
      <td className="px-4 py-2 text-right text-slate-600 dark:text-slate-400">
        {formatCurrency(row.runningBalance)}
      </td>
      {!readOnly && (
        <td className="px-4 py-2 text-right whitespace-nowrap">
          {confirmingDelete ? (
            <span className="flex items-center justify-end gap-2">
              <span className="text-xs text-slate-600 dark:text-slate-400">Delete?</span>
              <button
                type="button"
                disabled={deletePending}
                onClick={confirmDelete}
                className="rounded bg-red-700 px-2 py-1 text-xs font-medium text-white hover:bg-red-800 disabled:opacity-60"
              >
                {deletePending ? "Deleting..." : "Yes"}
              </button>
              <button
                type="button"
                onClick={() => setConfirmingDelete(false)}
                className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                No
              </button>
            </span>
          ) : (
            <span className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => setConfirmingDelete(true)}
                className="rounded border border-red-300 px-2 py-1 text-xs text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/40"
              >
                Delete
              </button>
            </span>
          )}
        </td>
      )}
    </tr>
  );
}
