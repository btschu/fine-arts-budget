import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

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
