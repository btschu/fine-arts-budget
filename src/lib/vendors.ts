import { prisma } from "@/lib/prisma";

export async function getVendorSuggestions(schoolId: string) {
  const rows = await prisma.expense.findMany({
    where: { schoolYear: { schoolId } },
    select: { vendor: true },
    distinct: ["vendor"],
    orderBy: { vendor: "asc" },
  });
  return rows.map((r) => r.vendor);
}
