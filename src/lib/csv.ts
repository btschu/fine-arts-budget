import type { LedgerRow } from "@/lib/ledger";

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function ledgerRowsToCsv(rows: LedgerRow[]): string {
  const header = [
    "Date",
    "Purchased from",
    "Item",
    "Category",
    "Amount",
    "Entered by",
    "Balance",
  ];
  const lines = [header.join(",")];
  // rows are newest-first in the UI; export chronologically (oldest first)
  const chronological = [...rows].reverse();
  for (const row of chronological) {
    lines.push(
      [
        row.spentAt.slice(0, 10),
        csvEscape(row.vendor),
        csvEscape(row.item),
        csvEscape(row.categoryName ?? ""),
        row.amount.toFixed(2),
        csvEscape(row.enteredByName),
        row.runningBalance.toFixed(2),
      ].join(",")
    );
  }
  return lines.join("\n");
}

export function downloadCsv(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
