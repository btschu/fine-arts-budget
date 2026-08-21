import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function getSchoolYearCategories(schoolYearId: string) {
  return prisma.budgetCategory.findMany({
    where: { schoolYearId },
    orderBy: { name: "asc" },
  });
}

export function effectiveStartingBalance(
  storedStartingBalance: Prisma.Decimal | number,
  categories: { allocatedAmount: Prisma.Decimal | number }[]
) {
  if (categories.length === 0) return Number(storedStartingBalance);
  return categories.reduce((sum, c) => sum + Number(c.allocatedAmount), 0);
}

export async function getCategorySpending(schoolYearId: string) {
  const grouped = await prisma.expense.groupBy({
    by: ["categoryId"],
    where: { schoolYearId, categoryId: { not: null } },
    _sum: { amount: true },
  });
  const map = new Map<string, number>();
  for (const g of grouped) {
    if (g.categoryId) {
      map.set(g.categoryId, g._sum.amount ? Number(g._sum.amount) : 0);
    }
  }
  return map;
}

export async function getYearBalance(
  schoolYearId: string,
  startingBalance: Prisma.Decimal | number
) {
  const result = await prisma.expense.aggregate({
    where: { schoolYearId },
    _sum: { amount: true },
  });
  const totalSpent = result._sum.amount ? Number(result._sum.amount) : 0;
  const balance = Number(startingBalance) - totalSpent;
  return { totalSpent, balance };
}

export async function getSpendingByTeacher(schoolYearId: string) {
  const grouped = await prisma.expense.groupBy({
    by: ["enteredById"],
    where: { schoolYearId },
    _sum: { amount: true },
    _count: { _all: true },
  });

  const users = await prisma.user.findMany({
    where: { id: { in: grouped.map((g) => g.enteredById) } },
    select: { id: true, name: true },
  });
  const nameById = new Map(users.map((u) => [u.id, u.name]));

  return grouped
    .map((g) => ({
      userId: g.enteredById,
      name: nameById.get(g.enteredById) ?? "Unknown",
      total: g._sum.amount ? Number(g._sum.amount) : 0,
      count: g._count._all,
    }))
    .sort((a, b) => b.total - a.total);
}
