import { formatCurrency } from "@/lib/format";

export default function SpendingByTeacher({
  data,
}: {
  data: { userId: string; name: string; total: number; count: number }[];
}) {
  if (data.length === 0) return null;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h3 className="mb-3 text-sm font-medium text-slate-900 dark:text-slate-100">
        Spending by teacher
      </h3>
      <ul className="flex flex-col gap-2">
        {data.map((row) => (
          <li
            key={row.userId}
            className="flex items-center justify-between text-sm"
          >
            <span className="text-slate-600 dark:text-slate-400">
              {row.name}{" "}
              <span className="text-xs text-slate-400 dark:text-slate-500">
                ({row.count} {row.count === 1 ? "purchase" : "purchases"})
              </span>
            </span>
            <span className="font-medium text-slate-900 dark:text-slate-100">
              {formatCurrency(row.total)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
