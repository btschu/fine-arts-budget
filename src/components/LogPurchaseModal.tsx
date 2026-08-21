"use client";

import { useRef, useState, useTransition } from "react";
import { addExpense } from "@/app/actions/expense-actions";
import { formatCurrency } from "@/lib/format";
import { compressImage } from "@/lib/compressImage";
import Modal from "@/components/Modal";

function todayLocal() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

export default function LogPurchaseModal({
  schoolYearId,
  currentBalance,
  vendorSuggestions = [],
  categories = [],
}: {
  schoolYearId: string;
  currentBalance: number;
  vendorSuggestions?: string[];
  categories?: { id: string; name: string; isDefault: boolean }[];
}) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const parsedAmount = Number(amount);
  const hasAmount = amount.trim() !== "" && Number.isFinite(parsedAmount);
  const balanceAfter = hasAmount ? currentBalance - parsedAmount : currentBalance;

  function close() {
    setOpen(false);
    setAmount("");
    setError(null);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded bg-red-800 px-4 py-2 text-sm font-medium text-white hover:bg-red-900"
      >
        + New expense
      </button>

      {open && (
        <Modal title="Log a purchase" onClose={close}>
          <div className="mb-4 rounded-md bg-slate-50 p-3 text-sm dark:bg-slate-800">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span>Current balance</span>
              <span>{formatCurrency(currentBalance)}</span>
            </div>
            <div
              className={`mt-1 flex items-center justify-between text-base font-semibold ${
                balanceAfter < 0
                  ? "text-red-600 dark:text-red-400"
                  : "text-slate-900 dark:text-slate-100"
              }`}
            >
              <span>Balance after</span>
              <span>{formatCurrency(balanceAfter)}</span>
            </div>
          </div>

          <form
            ref={formRef}
            action={async (formData) => {
              setError(null);
              const receipt = formData.get("receipt");
              if (receipt instanceof File && receipt.size > 0) {
                formData.set("receipt", await compressImage(receipt));
              }
              startTransition(async () => {
                try {
                  await addExpense(schoolYearId, formData);
                  close();
                } catch (err) {
                  setError(
                    err instanceof Error ? err.message : "Something went wrong."
                  );
                }
              });
            }}
            className="flex flex-col gap-3"
          >
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                Purchased from
              </label>
              <input
                name="vendor"
                type="text"
                required
                autoFocus
                list="vendor-suggestions"
                className="rounded border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
              <datalist id="vendor-suggestions">
                {vendorSuggestions.map((v) => (
                  <option key={v} value={v} />
                ))}
              </datalist>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                What was purchased
              </label>
              <input
                name="item"
                type="text"
                required
                className="rounded border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                Cost
              </label>
              <input
                name="amount"
                type="number"
                step="0.01"
                min="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="rounded border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
            {categories.length > 0 && (
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  Category
                </label>
                <select
                  name="categoryId"
                  defaultValue={categories.find((c) => c.isDefault)?.id ?? ""}
                  className="rounded border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                >
                  <option value="">Uncategorized</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                Date of purchase
              </label>
              <input
                name="spentAt"
                type="date"
                defaultValue={todayLocal()}
                className="rounded border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                Receipt photo (optional)
              </label>
              <input
                name="receipt"
                type="file"
                accept="image/*"
                className="text-sm text-slate-500 file:mr-2 file:rounded file:border-0 file:bg-slate-100 file:px-2 file:py-1 file:text-xs dark:text-slate-400 dark:file:bg-slate-800 dark:file:text-slate-300"
              />
            </div>
            {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
            <div className="mt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={close}
                className="rounded border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={pending}
                className="rounded bg-red-800 px-4 py-2 text-sm font-medium text-white hover:bg-red-900 disabled:opacity-60"
              >
                {pending ? "Logging..." : "Log purchase"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
