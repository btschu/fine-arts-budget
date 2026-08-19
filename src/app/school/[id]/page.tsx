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
import { getSpendingByTeacher } from "@/lib/balance";
import { buildLedgerRows } from "@/lib/ledger";
import LogPurchaseModal from "@/components/LogPurchaseModal";
import StartingBalanceEditor from "@/components/StartingBalanceEditor";
import ExpenseLedger from "@/components/ExpenseLedger";
import CloseYearForm from "@/components/CloseYearForm";
import SpendingByTeacher from "@/components/SpendingByTeacher";

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
    include: { enteredBy: true, updatedBy: true },
  });

  const startingBalance = Number(activeYear.startingBalance);
  const { rows, endingBalance: currentBalance } = buildLedgerRows(
    startingBalance,
    expenses
  );

  const spendingByTeacher = await getSpendingByTeacher(activeYear.id);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:py-10">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            {school.name}
          </h1>
          <p className="text-xs text-slate-400">{activeYear.label} school year</p>
          <StartingBalanceEditor
            schoolYearId={activeYear.id}
            startingBalance={startingBalance}
          />
          <div className="mt-1">
            <Link
              href={`/school/${school.id}/years`}
              className="inline-block rounded border border-slate-300 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
            >
              View past years
            </Link>
          </div>
        </div>
        <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end sm:gap-1">
          <div className="sm:text-right">
            <p className="text-sm text-slate-500">Available balance</p>
            <p
              className={`text-3xl font-semibold ${
                currentBalance < 0 ? "text-red-600" : "text-slate-900"
              }`}
            >
              {formatCurrency(currentBalance)}
            </p>
          </div>
          <LogPurchaseModal
            schoolYearId={activeYear.id}
            currentBalance={currentBalance}
          />
        </div>
      </div>

      <ExpenseLedger schoolYearId={activeYear.id} rows={rows} />

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
