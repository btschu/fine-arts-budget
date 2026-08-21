import Link from "next/link";
import { notFound } from "next/navigation";
import {
  requireUser,
  requireSchoolAccess,
  getActiveSchoolYear,
  isAdmin,
} from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/format";
import {
  getSpendingByTeacher,
  getSchoolYearCategories,
  getCategorySpending,
  effectiveStartingBalance,
} from "@/lib/balance";
import { buildLedgerRows } from "@/lib/ledger";
import { getVendorSuggestions } from "@/lib/vendors";
import LogPurchaseModal from "@/components/LogPurchaseModal";
import StartingBalanceEditor from "@/components/StartingBalanceEditor";
import ExpenseLedger from "@/components/ExpenseLedger";
import CloseYearForm from "@/components/CloseYearForm";
import SpendingByTeacher from "@/components/SpendingByTeacher";
import CategoryBreakdown from "@/components/CategoryBreakdown";

export default async function SchoolPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: schoolId } = await params;
  const user = await requireUser();
  await requireSchoolAccess(schoolId, user.id);

  const school = await prisma.school.findUnique({ where: { id: schoolId } });
  if (!school) notFound();

  const activeYear = await getActiveSchoolYear(schoolId);
  if (!activeYear) notFound();

  const admin = await isAdmin(user.id);

  const expenses = await prisma.expense.findMany({
    where: { schoolYearId: activeYear.id },
    orderBy: { spentAt: "asc" },
    include: { enteredBy: true, updatedBy: true, category: true },
  });

  const categories = await getSchoolYearCategories(activeYear.id);
  const categorySpending = await getCategorySpending(activeYear.id);
  const startingBalance = effectiveStartingBalance(
    activeYear.startingBalance,
    categories
  );
  const { rows, endingBalance: currentBalance } = buildLedgerRows(
    startingBalance,
    expenses
  );

  const spendingByTeacher = await getSpendingByTeacher(activeYear.id);
  const vendorSuggestions = await getVendorSuggestions(school.id);

  const categoryOptions = categories.map((c) => ({
    id: c.id,
    name: c.name,
    isDefault: c.isDefault,
  }));
  const categoryBreakdown = categories.map((c) => ({
    id: c.id,
    name: c.name,
    color: c.color,
    isDefault: c.isDefault,
    allocatedAmount: Number(c.allocatedAmount),
    spent: categorySpending.get(c.id) ?? 0,
  }));

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:py-10">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
            {school.name}
          </h1>
          <p className="text-xs text-slate-400 dark:text-slate-500">{activeYear.label} school year</p>
          {categories.length > 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Total budget: {formatCurrency(startingBalance)} (sum of
              category budgets below)
            </p>
          ) : (
            <StartingBalanceEditor
              schoolYearId={activeYear.id}
              startingBalance={startingBalance}
            />
          )}
          <div className="mt-1">
            <Link
              href={`/school/${school.id}/years`}
              className="inline-block rounded border border-slate-300 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              View past years
            </Link>
          </div>
        </div>
        <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end sm:gap-1">
          <div className="sm:text-right">
            <p className="text-sm text-slate-500 dark:text-slate-400">Available balance</p>
            <p
              className={`text-3xl font-semibold ${
                currentBalance < 0
                  ? "text-red-600 dark:text-red-400"
                  : "text-slate-900 dark:text-slate-100"
              }`}
            >
              {formatCurrency(currentBalance)}
            </p>
          </div>
          <LogPurchaseModal
            schoolYearId={activeYear.id}
            currentBalance={currentBalance}
            vendorSuggestions={vendorSuggestions}
            categories={categoryOptions}
          />
        </div>
      </div>

      {(categories.length > 0 || admin) && (
        <CategoryBreakdown
          schoolYearId={activeYear.id}
          categories={categoryBreakdown}
          admin={admin}
        />
      )}

      <ExpenseLedger
        schoolYearId={activeYear.id}
        rows={rows}
        vendorSuggestions={vendorSuggestions}
        categories={categoryOptions}
        exportFilename={`${school.name} - ${activeYear.label}.csv`}
      />

      {spendingByTeacher.length > 0 && (
        <div className="mt-6">
          <SpendingByTeacher data={spendingByTeacher} />
        </div>
      )}

      {admin && (
        <div className="mt-8">
          <CloseYearForm
            schoolId={school.id}
            currentLabel={activeYear.label}
            endingBalance={currentBalance}
          />
        </div>
      )}
    </div>
  );
}
