"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser, assertAdmin, assertSchoolAccess } from "@/lib/authz";

export async function createSchool(formData: FormData) {
  const actor = await requireUser();
  await assertAdmin(actor.id);

  const name = String(formData.get("name") ?? "").trim();
  const yearLabel = String(formData.get("yearLabel") ?? "").trim();
  const startingBalanceRaw = formData.get("startingBalance");
  const startingBalance = startingBalanceRaw
    ? Math.round(Number(startingBalanceRaw) * 100) / 100
    : 0;

  if (!name) throw new Error("School name is required.");
  if (!yearLabel) {
    throw new Error("School year name is required, e.g. 2026-2027.");
  }
  if (!Number.isFinite(startingBalance)) {
    throw new Error("Starting balance must be a number.");
  }

  const existing = await prisma.school.findUnique({ where: { name } });
  if (existing) {
    throw new Error(`A school named "${name}" already exists.`);
  }

  const school = await prisma.school.create({ data: { name } });

  await prisma.$transaction([
    prisma.schoolYear.create({
      data: { schoolId: school.id, label: yearLabel, startingBalance },
    }),
    prisma.membership.create({
      data: { userId: actor.id, schoolId: school.id },
    }),
  ]);

  revalidatePath("/settings");
  revalidatePath("/");
}

export async function renameSchool(schoolId: string, formData: FormData) {
  const actor = await requireUser();
  await assertSchoolAccess(schoolId, actor.id);
  await assertAdmin(actor.id);

  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("School name is required.");

  const existing = await prisma.school.findUnique({ where: { name } });
  if (existing && existing.id !== schoolId) {
    throw new Error(`A school named "${name}" already exists.`);
  }

  await prisma.school.update({ where: { id: schoolId }, data: { name } });

  revalidatePath("/settings");
  revalidatePath("/");
  revalidatePath(`/school/${schoolId}`);
}

export async function deleteSchool(schoolId: string) {
  const actor = await requireUser();
  await assertSchoolAccess(schoolId, actor.id);
  await assertAdmin(actor.id);

  const expenseCount = await prisma.expense.count({
    where: { schoolYear: { schoolId } },
  });
  if (expenseCount > 0) {
    throw new Error(
      "This school has purchases logged against it, so it can't be deleted — that would permanently erase the spending record. Rename it instead if it's no longer active."
    );
  }

  const otherMemberCount = await prisma.membership.count({
    where: { schoolId, userId: { not: actor.id } },
  });
  if (otherMemberCount > 0) {
    throw new Error(
      "Other teachers still have access to this school. Remove their access first, or make sure this is really the right school before deleting it."
    );
  }

  await prisma.school.delete({ where: { id: schoolId } });

  revalidatePath("/settings");
  revalidatePath("/");
}
