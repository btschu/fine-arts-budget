"use client";

import { useState, useTransition } from "react";
import {
  setMemberships,
  deleteTeacherAccount,
  resetTeacherPassword,
} from "@/app/actions/user-actions";
import Modal from "@/components/Modal";

export default function ManageMemberModal({
  memberId,
  memberName,
  memberEmail,
  schools,
  currentSchoolIds,
}: {
  memberId: string;
  memberName: string;
  memberEmail: string;
  schools: { id: string; name: string }[];
  currentSchoolIds: string[];
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletePending, startDeleteTransition] = useTransition();

  const [resetError, setResetError] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState<string | null>(null);
  const [resetPending, startResetTransition] = useTransition();

  function close() {
    setOpen(false);
    setConfirmingDelete(false);
    setDeleteError(null);
    setResetError(null);
    setNewPassword(null);
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
        <Modal title={memberName} onClose={close}>
          <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">{memberEmail}</p>
          <form
            action={(formData) => {
              setError(null);
              startTransition(async () => {
                try {
                  await setMemberships(memberId, formData);
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
            <div>
              <p className="mb-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                Schools
              </p>
              <div className="flex flex-col gap-2">
                {schools.map((school) => (
                  <label
                    key={school.id}
                    className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300"
                  >
                    <input
                      type="checkbox"
                      name="schoolIds"
                      value={school.id}
                      defaultChecked={currentSchoolIds.includes(school.id)}
                    />
                    {school.name}
                  </label>
                ))}
              </div>
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
              Password
            </p>
            {newPassword ? (
              <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-900 dark:bg-emerald-950/40">
                <p className="mb-1 text-sm text-slate-700 dark:text-slate-300">
                  New temporary password — share this with {memberName}:
                </p>
                <p className="select-all rounded bg-white px-2 py-1 font-mono text-sm text-slate-900 dark:bg-slate-800 dark:text-slate-100">
                  {newPassword}
                </p>
              </div>
            ) : (
              <button
                type="button"
                disabled={resetPending}
                onClick={() => {
                  setResetError(null);
                  startResetTransition(async () => {
                    try {
                      const pw = await resetTeacherPassword(memberId);
                      setNewPassword(pw);
                    } catch (err) {
                      setResetError(
                        err instanceof Error
                          ? err.message
                          : "Something went wrong."
                      );
                    }
                  });
                }}
                className="rounded border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                {resetPending ? "Resetting..." : "Reset password"}
              </button>
            )}
            {resetError && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">{resetError}</p>
            )}
          </div>

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
                Delete this teacher&apos;s account
              </button>
            ) : (
              <div className="rounded-md border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950/40">
                <p className="mb-3 text-sm text-slate-700 dark:text-slate-300">
                  Permanently delete {memberName}&apos;s account? This can&apos;t
                  be undone.
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
                          await deleteTeacherAccount(memberId);
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
