import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser, requireSchoolAccess } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import {
  getYearBalance,
  getSchoolYearCategories,
  effectiveStartingBalance,
} from "@/lib/balance";
import { formatCurrency, formatDate } from "@/lib/format";

export default async function SchoolYearsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: schoolId } = await params;
  const user = await requireUser();
  await requireSchoolAccess(schoolId, user.id);

  const school = await prisma.school.findUnique({ where: { id: schoolId } });
  if (!school) notFound();

  const years = await prisma.schoolYear.findMany({
    where: { schoolId },
    orderBy: { startedAt: "desc" },
  });

  const yearsWithBalance = await Promise.all(
    years.map(async (year) => {
      const categories = await getSchoolYearCategories(year.id);
      const startingBalance = effectiveStartingBalance(
        year.startingBalance,
        categories
      );
      const { balance } = await getYearBalance(year.id, startingBalance);
      return { ...year, endingBalance: balance };
    })
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:py-10">
      <Link
        href={`/school/${schoolId}`}
        className="inline-block rounded border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
      >
        ← Back to {school.name}
      </Link>
      <h1 className="mt-2 mb-6 text-2xl font-semibold text-slate-900 dark:text-slate-100">
        {school.name} — school years
      </h1>

      <div className="flex flex-col gap-3">
        {yearsWithBalance.map((year) => (
          <Link
            key={year.id}
            href={`/school/${schoolId}/years/${year.id}`}
            className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4 shadow-sm hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
          >
            <div>
              <p className="font-medium text-slate-900 dark:text-slate-100">
                {year.label}{" "}
                {!year.closedAt && (
                  <span className="ml-1 rounded bg-emerald-100 px-1.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                    Active
                  </span>
                )}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Started {formatDate(year.startedAt)}
                {year.closedAt && ` · Closed ${formatDate(year.closedAt)}`}
              </p>
            </div>
            <p className="font-medium text-slate-900 dark:text-slate-100">
              {formatCurrency(year.endingBalance)}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
