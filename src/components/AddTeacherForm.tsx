"use client";

import { useRef, useState, useTransition } from "react";
import { addTeacher } from "@/app/actions/user-actions";

export default function AddTeacherForm({
  schools,
}: {
  schools: { id: string; name: string }[];
}) {
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
            await addTeacher(formData);
            formRef.current?.reset();
          } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong.");
          }
        });
      }}
      className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
    >
      <h2 className="font-medium text-slate-900">Add a teacher</h2>
      <p className="text-xs text-slate-500">
        If the email already has an account, they&apos;ll just be added to
        the schools you check below — name and password are ignored in that
        case.
      </p>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-600">Name</label>
          <input
            name="name"
            type="text"
            className="rounded border border-slate-300 px-2 py-1.5 text-sm"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-600">Email</label>
          <input
            name="email"
            type="email"
            required
            className="rounded border border-slate-300 px-2 py-1.5 text-sm"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-600">
            Temporary password
          </label>
          <input
            name="password"
            type="text"
            placeholder="only for new teachers"
            className="rounded border border-slate-300 px-2 py-1.5 text-sm"
          />
        </div>
      </div>
      <div className="flex flex-wrap gap-4">
        {schools.map((school) => (
          <label
            key={school.id}
            className="flex items-center gap-2 text-sm text-slate-700"
          >
            <input type="checkbox" name="schoolIds" value={school.id} />
            {school.name}
          </label>
        ))}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="self-start rounded bg-red-800 px-4 py-1.5 text-sm font-medium text-white hover:bg-red-900 disabled:opacity-60"
      >
        {pending ? "Adding..." : "Add teacher"}
      </button>
    </form>
  );
}
