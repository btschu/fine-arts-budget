"use client";

import { useActionState } from "react";
import { changePassword } from "@/app/actions/user-actions";

export default function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState(changePassword, {
    error: null,
    success: false,
  });

  return (
    <form
      action={formAction}
      className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
    >
      <h2 className="font-medium text-slate-900">Change password</h2>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-slate-600">
          Current password
        </label>
        <input
          name="currentPassword"
          type="password"
          required
          autoComplete="current-password"
          className="rounded border border-slate-300 px-2 py-1.5 text-sm sm:max-w-xs"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-slate-600">
          New password
        </label>
        <input
          name="newPassword"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="rounded border border-slate-300 px-2 py-1.5 text-sm sm:max-w-xs"
        />
      </div>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.success && (
        <p className="text-sm text-emerald-600">Password updated.</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="self-start rounded bg-red-800 px-4 py-1.5 text-sm font-medium text-white hover:bg-red-900 disabled:opacity-60"
      >
        {pending ? "Saving..." : "Update password"}
      </button>
    </form>
  );
}
