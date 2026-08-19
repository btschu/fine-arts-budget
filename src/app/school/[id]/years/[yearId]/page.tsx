import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser, requireSchoolAccess } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { getSpendingByTeacher } from "@/lib/balance";
import { buildLedgerRows } from "@/lib/ledger";
import { formatCurrency, formatDate } from "@/lib/format";
import ExpenseLedger from "@/components/ExpenseLedger";
import SpendingByTeacher from "@/components/SpendingByTeacher";
import PrintButton from "@/components/PrintButton";

export default async function SchoolYearReportPage({
  params,
}: {
  params: Promise<{ id: string; yearId: string }>;
}) {
  const { id: schoolId, yearId } = await params;
  const user = await requireUser();
  await requireSchoolAccess(schoolId, user.id);

  const school = await prisma.school.findUnique({ where: { id: schoolId } });
  const year = await prisma.schoolYear.findUnique({
    where: { id: yearId },
    include: { closedBy: true },
  });
  if (!school || !year || year.schoolId !== schoolId) notFound();

  const expenses = await prisma.expense.findMany({
    where: { schoolYearId: year.id },
    orderBy: { spentAt: "asc" },
    include: { enteredBy: true, updatedBy: true },
  });

  const startingBalance = Number(year.startingBalance);
  const { rows, endingBalance } = buildLedgerRows(startingBalance, expenses);

  const spendingByTeacher = await getSpendingByTeacher(year.id);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:py-10">
      <div className="no-print mb-4 flex items-center justify-between">
        <Link
          href={`/school/${schoolId}/years`}
          className="rounded border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
        >
          ← Back to school years
        </Link>
        <PrintButton />
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">
          {school.name} — {year.label}
        </h1>
        <p className="text-sm text-slate-500">
          {formatDate(year.startedAt)} –{" "}
          {year.closedAt ? formatDate(year.closedAt) : "present"}
          {year.closedAt && year.closedBy && ` · Closed by ${year.closedBy.name}`}
        </p>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">Starting balance</p>
          <p className="text-lg font-semibold text-slate-900">
            {formatCurrency(startingBalance)}
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">
            {year.closedAt ? "Ending balance" : "Current balance"}
          </p>
          <p
            className={`text-lg font-semibold ${
              endingBalance < 0 ? "text-red-600" : "text-slate-900"
            }`}
          >
            {formatCurrency(endingBalance)}
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">Total spent</p>
          <p className="text-lg font-semibold text-slate-900">
            {formatCurrency(startingBalance - endingBalance)}
          </p>
        </div>
      </div>

      {spendingByTeacher.length > 0 && (
        <div className="mb-6">
          <SpendingByTeacher data={spendingByTeacher} />
        </div>
      )}

      <ExpenseLedger
        schoolYearId={year.id}
        rows={rows}
        readOnly
        exportFilename={`${school.name} - ${year.label}.csv`}
      />
    </div>
  );
}
