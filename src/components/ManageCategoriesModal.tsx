"use client";

import { useRef, useState, useTransition } from "react";
import {
  addCategory,
  updateCategory,
  deleteCategory,
} from "@/app/actions/category-actions";
import { CATEGORY_COLORS, categorySwatchClass } from "@/lib/categoryColors";
import Modal from "@/components/Modal";

type Category = {
  id: string;
  name: string;
  allocatedAmount: number;
  color: string;
  isDefault: boolean;
};

function ColorPicker({
  name,
  defaultValue,
}: {
  name: string;
  defaultValue: string;
}) {
  const [selected, setSelected] = useState(defaultValue);
  return (
    <div className="flex flex-wrap gap-1.5">
      {CATEGORY_COLORS.map((c) => (
        <label key={c} className="cursor-pointer">
          <input
            type="radio"
            name={name}
            value={c}
            checked={selected === c}
            onChange={() => setSelected(c)}
            className="sr-only"
          />
          <span
            className={`block h-5 w-5 rounded-full ${categorySwatchClass(c)} ${
              selected === c
                ? "ring-2 ring-slate-900 ring-offset-1 dark:ring-neutral-100 dark:ring-offset-neutral-900"
                : ""
            }`}
          />
        </label>
      ))}
    </div>
  );
}

function CategoryRow({ category }: { category: Category }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletePending, startDeleteTransition] = useTransition();

  return (
    <div className="rounded-lg border border-slate-200 p-3 dark:border-neutral-800">
      <form
        action={(formData) => {
          setError(null);
          startTransition(async () => {
            try {
              await updateCategory(category.id, formData);
            } catch (err) {
              setError(
                err instanceof Error ? err.message : "Something went wrong."
              );
            }
          });
        }}
        className="flex flex-col gap-2"
      >
        <div className="flex gap-2">
          <input
            name="name"
            defaultValue={category.name}
            required
            className="min-w-0 flex-1 rounded border border-slate-300 px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
          />
          <input
            name="allocatedAmount"
            type="number"
            step="0.01"
            min="0"
            defaultValue={category.allocatedAmount}
            required
            className="w-28 rounded border border-slate-300 px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
          />
        </div>
        <div className="flex items-center justify-between gap-3">
          <ColorPicker name="color" defaultValue={category.color} />
          <label className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-neutral-400">
            <input
              type="checkbox"
              name="isDefault"
              defaultChecked={category.isDefault}
            />
            Default
          </label>
        </div>
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        {deleteError && (
          <p className="text-sm text-red-600 dark:text-red-400">{deleteError}</p>
        )}
        <div className="flex items-center justify-between gap-2">
          {!confirmingDelete ? (
            <button
              type="button"
              onClick={() => setConfirmingDelete(true)}
              className="rounded border border-red-300 px-2 py-1 text-xs text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/40"
            >
              Delete
            </button>
          ) : (
            <span className="flex items-center gap-2">
              <span className="text-xs text-slate-600 dark:text-neutral-400">
                Delete?
              </span>
              <button
                type="button"
                disabled={deletePending}
                onClick={() => {
                  setDeleteError(null);
                  startDeleteTransition(async () => {
                    try {
                      await deleteCategory(category.id);
                    } catch (err) {
                      setDeleteError(
                        err instanceof Error
                          ? err.message
                          : "Something went wrong."
                      );
                      setConfirmingDelete(false);
                    }
                  });
                }}
                className="rounded bg-red-700 px-2 py-1 text-xs font-medium text-white hover:bg-red-800 disabled:opacity-60"
              >
                {deletePending ? "Deleting..." : "Yes"}
              </button>
              <button
                type="button"
                onClick={() => setConfirmingDelete(false)}
                className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800"
              >
                No
              </button>
            </span>
          )}
          <button
            type="submit"
            disabled={pending}
            className="rounded bg-red-800 px-3 py-1 text-xs font-medium text-white hover:bg-red-900 disabled:opacity-60"
          >
            {pending ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}

function AddCategoryForm({ schoolYearId }: { schoolYearId: string }) {
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
            await addCategory(schoolYearId, formData);
            formRef.current?.reset();
          } catch (err) {
            setError(
              err instanceof Error ? err.message : "Something went wrong."
            );
          }
        });
      }}
      className="flex flex-col gap-2"
    >
      <p className="text-xs font-medium text-slate-600 dark:text-neutral-400">
        Add a category
      </p>
      <div className="flex gap-2">
        <input
          name="name"
          placeholder="Category name"
          required
          className="min-w-0 flex-1 rounded border border-slate-300 px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
        />
        <input
          name="allocatedAmount"
          type="number"
          step="0.01"
          min="0"
          placeholder="0.00"
          required
          className="w-28 rounded border border-slate-300 px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
        />
      </div>
      <div className="flex items-center justify-between gap-3">
        <ColorPicker name="color" defaultValue="slate" />
        <label className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-neutral-400">
          <input type="checkbox" name="isDefault" />
          Default
        </label>
      </div>
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="self-start rounded bg-red-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-900 disabled:opacity-60"
      >
        {pending ? "Adding..." : "Add category"}
      </button>
    </form>
  );
}

export default function ManageCategoriesModal({
  schoolYearId,
  categories,
}: {
  schoolYearId: string;
  categories: Category[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800"
      >
        {categories.length === 0 ? "Add budget categories" : "Manage categories"}
      </button>

      {open && (
        <Modal title="Budget categories" onClose={() => setOpen(false)}>
          {categories.length > 0 && (
            <div className="mb-4 flex flex-col gap-3">
              {categories.map((c) => (
                <CategoryRow key={c.id} category={c} />
              ))}
            </div>
          )}
          <div
            className={
              categories.length > 0
                ? "border-t border-slate-200 pt-4 dark:border-neutral-800"
                : ""
            }
          >
            <AddCategoryForm schoolYearId={schoolYearId} />
          </div>
        </Modal>
      )}
    </>
  );
}
