import Link from "next/link";
import { requireUser, getMySchools, getActiveSchoolYear } from "@/lib/authz";
import {
  getYearBalance,
  getSchoolYearCategories,
  effectiveStartingBalance,
} from "@/lib/balance";
import { formatCurrency } from "@/lib/format";

export default async function DashboardPage() {
  const user = await requireUser();
  const schools = await getMySchools(user.id);

  const schoolsWithBalance = await Promise.all(
    schools.map(async (school) => {
      const activeYear = await getActiveSchoolYear(school.id);
      let balance = 0;
      if (activeYear) {
        const categories = await getSchoolYearCategories(activeYear.id);
        const startingBalance = effectiveStartingBalance(
          activeYear.startingBalance,
          categories
        );
        balance = (await getYearBalance(activeYear.id, startingBalance)).balance;
      }
      return { ...school, activeYear, balance };
    })
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:py-10">
      <h1 className="mb-6 text-2xl font-semibold text-slate-900 dark:text-neutral-100">
        Your schools
      </h1>
      {schoolsWithBalance.length === 0 ? (
        <p className="text-slate-500 dark:text-neutral-400">
          You haven&apos;t been added to a school&apos;s budget yet. Ask
          whoever set up your account to add you.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {schoolsWithBalance.map((school) => (
            <Link
              key={school.id}
              href={`/school/${school.id}`}
              className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition hover:border-slate-300 hover:shadow dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-700"
            >
              <h2 className="text-lg font-medium text-slate-900 dark:text-neutral-100">
                {school.name}
              </h2>
              {school.activeYear && (
                <p className="mt-1 text-xs text-slate-400 dark:text-neutral-500">
                  {school.activeYear.label} school year
                </p>
              )}
              <p className="mt-3 text-sm text-slate-500 dark:text-neutral-400">
                Available balance
              </p>
              <p
                className={`mt-1 text-2xl font-semibold ${
                  school.balance < 0
                    ? "text-red-600 dark:text-red-400"
                    : "text-slate-900 dark:text-neutral-100"
                }`}
              >
                {formatCurrency(school.balance)}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
