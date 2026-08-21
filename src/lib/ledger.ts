export type LedgerRow = {
  id: string;
  amount: number;
  item: string;
  vendor: string;
  spentAt: string;
  enteredByName: string;
  updatedByName: string | null;
  runningBalance: number;
  hasReceipt: boolean;
  categoryId: string | null;
  categoryName: string | null;
  categoryColor: string | null;
};

type ExpenseLike = {
  id: string;
  amount: unknown;
  item: string;
  vendor: string;
  spentAt: Date;
  receiptMimeType: string | null;
  enteredBy: { name: string };
  updatedBy: { name: string } | null;
  category: { id: string; name: string; color: string } | null;
};

export function buildLedgerRows(
  startingBalance: number,
  expensesAscending: ExpenseLike[]
) {
  let running = startingBalance;
  const rows: LedgerRow[] = [];
  for (const expense of expensesAscending) {
    running -= Number(expense.amount);
    rows.push({
      id: expense.id,
      amount: Number(expense.amount),
      item: expense.item,
      vendor: expense.vendor,
      spentAt: expense.spentAt.toISOString(),
      enteredByName: expense.enteredBy.name,
      updatedByName: expense.updatedBy?.name ?? null,
      runningBalance: running,
      hasReceipt: expense.receiptMimeType != null,
      categoryId: expense.category?.id ?? null,
      categoryName: expense.category?.name ?? null,
      categoryColor: expense.category?.color ?? null,
    });
  }
  rows.reverse();
  return { rows, endingBalance: running };
}
