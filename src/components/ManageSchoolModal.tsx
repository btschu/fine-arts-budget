"use client";

import { useState, useTransition } from "react";
import { renameSchool, deleteSchool } from "@/app/actions/school-actions";
import Modal from "@/components/Modal";

export default function ManageSchoolModal({
  schoolId,
  schoolName,
}: {
  schoolId: string;
  schoolName: string;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletePending, startDeleteTransition] = useTransition();

  function close() {
    setOpen(false);
    setConfirmingDelete(false);
    setDeleteError(null);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
      >
        Manage
      </button>

      {open && (
        <Modal title={schoolName} onClose={close}>
          <form
            action={(formData) => {
              setError(null);
              startTransition(async () => {
                try {
                  await renameSchool(schoolId, formData);
                  close();
                } catch (err) {
                  setError(
                    err instanceof Error ? err.message : "Something went wrong."
                  );
                }
              });
            }}
            className="flex flex-col gap-4"
          >
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                School name
              </label>
              <input
                name="name"
                type="text"
                required
                defaultValue={schoolName}
                className="rounded border border-slate-300 px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
            {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
            <div className="flex justify-end gap-2">
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
                {pending ? "Saving..." : "Save"}
              </button>
            </div>
          </form>

          <div className="mt-6 border-t border-slate-200 pt-4 dark:border-slate-800">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
              Danger zone
            </p>
            {!confirmingDelete ? (
              <button
                type="button"
                onClick={() => setConfirmingDelete(true)}
                className="rounded border border-red-300 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/40"
              >
                Delete this school
              </button>
            ) : (
              <div className="rounded-md border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950/40">
                <p className="mb-3 text-sm text-slate-700 dark:text-slate-300">
                  Permanently delete {schoolName}? This can&apos;t be undone.
                </p>
                {deleteError && (
                  <p className="mb-3 text-sm text-red-600 dark:text-red-400">{deleteError}</p>
                )}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteError(null);
                      startDeleteTransition(async () => {
                        try {
                          await deleteSchool(schoolId);
                          close();
                        } catch (err) {
                          setDeleteError(
                            err instanceof Error
                              ? err.message
                              : "Something went wrong."
                          );
                        }
                      });
                    }}
                    disabled={deletePending}
                    className="rounded bg-red-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-800 disabled:opacity-60"
                  >
                    {deletePending ? "Deleting..." : "Yes, delete permanently"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setConfirmingDelete(false);
                      setDeleteError(null);
                    }}
                    className="rounded border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </>
  );
}
