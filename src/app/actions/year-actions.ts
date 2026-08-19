"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser, assertSchoolAccess, assertAdmin } from "@/lib/authz";
import { getYearBalance } from "@/lib/balance";

export async function closeSchoolYear(schoolId: string, formData: FormData) {
  const user = await requireUser();
  await assertSchoolAccess(schoolId, user.id);
  await assertAdmin(user.id);

  const newLabel = String(formData.get("newLabel") ?? "").trim();
  if (!newLabel) throw new Error("Give the new school year a name, e.g. 2027-2028.");

  const activeYear = await prisma.schoolYear.findFirst({
    where: { schoolId, closedAt: null },
  });
  if (!activeYear) throw new Error("No active school year to close.");

  const existingWithLabel = await prisma.schoolYear.findUnique({
    where: { schoolId_label: { schoolId, label: newLabel } },
  });
  if (existingWithLabel) {
    throw new Error(`A school year named "${newLabel}" already exists.`);
  }

  const { balance } = await getYearBalance(activeYear.id, activeYear.startingBalance);

  const overrideRaw = formData.get("newStartingBalance");
  const newStartingBalance =
    overrideRaw && String(overrideRaw).trim() !== ""
      ? Math.round(Number(overrideRaw) * 100) / 100
      : Math.round(balance * 100) / 100;

  if (!Number.isFinite(newStartingBalance)) {
    throw new Error("New starting balance must be a number.");
  }

  await prisma.$transaction([
    prisma.schoolYear.update({
      where: { id: activeYear.id },
      data: { closedAt: new Date(), closedById: user.id },
    }),
    prisma.schoolYear.create({
      data: {
        schoolId,
        label: newLabel,
        startingBalance: newStartingBalance,
      },
    }),
  ]);

  revalidatePath(`/school/${schoolId}`);
  revalidatePath(`/school/${schoolId}/years`);
}
