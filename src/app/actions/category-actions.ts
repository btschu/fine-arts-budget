"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser, assertSchoolAccess, assertAdmin } from "@/lib/authz";
import { CATEGORY_COLORS } from "@/lib/categoryColors";

function parseAllocatedAmount(raw: FormDataEntryValue | null): number {
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0) {
    throw new Error("Allocated amount must be a positive number.");
  }
  return Math.round(value * 100) / 100;
}

function parseColor(raw: FormDataEntryValue | null): string {
  const value = String(raw ?? "");
  return (CATEGORY_COLORS as readonly string[]).includes(value) ? value : "slate";
}

async function schoolYearWithAccess(schoolYearId: string, userId: string) {
  const schoolYear = await prisma.schoolYear.findUnique({
    where: { id: schoolYearId },
  });
  if (!schoolYear) throw new Error("School year not found.");
  await assertSchoolAccess(schoolYear.schoolId, userId);
  return schoolYear;
}

export async function addCategory(schoolYearId: string, formData: FormData) {
  const actor = await requireUser();
  const schoolYear = await schoolYearWithAccess(schoolYearId, actor.id);
  await assertAdmin(actor.id);
  if (schoolYear.closedAt) throw new Error("This school year is closed.");

  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Category name is required.");
  const allocatedAmount = parseAllocatedAmount(formData.get("allocatedAmount"));
  const color = parseColor(formData.get("color"));
  const isDefault = formData.get("isDefault") === "on";

  const existing = await prisma.budgetCategory.findUnique({
    where: { schoolYearId_name: { schoolYearId, name } },
  });
  if (existing) throw new Error(`A category named "${name}" already exists.`);

  if (isDefault) {
    await prisma.budgetCategory.updateMany({
      where: { schoolYearId },
      data: { isDefault: false },
    });
  }

  await prisma.budgetCategory.create({
    data: { schoolYearId, name, allocatedAmount, color, isDefault },
  });

  revalidatePath(`/school/${schoolYear.schoolId}`);
}

export async function updateCategory(categoryId: string, formData: FormData) {
  const actor = await requireUser();
  const category = await prisma.budgetCategory.findUnique({
    where: { id: categoryId },
    include: { schoolYear: true },
  });
  if (!category) throw new Error("Category not found.");
  await assertSchoolAccess(category.schoolYear.schoolId, actor.id);
  await assertAdmin(actor.id);
  if (category.schoolYear.closedAt) throw new Error("This school year is closed.");

  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Category name is required.");
  const allocatedAmount = parseAllocatedAmount(formData.get("allocatedAmount"));
  const color = parseColor(formData.get("color"));
  const isDefault = formData.get("isDefault") === "on";

  const existing = await prisma.budgetCategory.findUnique({
    where: {
      schoolYearId_name: { schoolYearId: category.schoolYearId, name },
    },
  });
  if (existing && existing.id !== categoryId) {
    throw new Error(`A category named "${name}" already exists.`);
  }

  if (isDefault) {
    await prisma.budgetCategory.updateMany({
      where: { schoolYearId: category.schoolYearId, id: { not: categoryId } },
      data: { isDefault: false },
    });
  }

  await prisma.budgetCategory.update({
    where: { id: categoryId },
    data: { name, allocatedAmount, color, isDefault },
  });

  revalidatePath(`/school/${category.schoolYear.schoolId}`);
}

export async function deleteCategory(categoryId: string) {
  const actor = await requireUser();
  const category = await prisma.budgetCategory.findUnique({
    where: { id: categoryId },
    include: { schoolYear: true },
  });
  if (!category) throw new Error("Category not found.");
  await assertSchoolAccess(category.schoolYear.schoolId, actor.id);
  await assertAdmin(actor.id);
  if (category.schoolYear.closedAt) throw new Error("This school year is closed.");

  const expenseCount = await prisma.expense.count({ where: { categoryId } });
  if (expenseCount > 0) {
    throw new Error(
      "Purchases are logged under this category, so it can't be deleted — that would lose the category tag on those records. Rename it instead."
    );
  }

  await prisma.budgetCategory.delete({ where: { id: categoryId } });

  revalidatePath(`/school/${category.schoolYear.schoolId}`);
}
