"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser, assertAdmin } from "@/lib/authz";

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
