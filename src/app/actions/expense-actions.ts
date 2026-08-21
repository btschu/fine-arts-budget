"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser, assertSchoolAccess } from "@/lib/authz";

function parseAmount(raw: FormDataEntryValue | null): number {
  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error("Amount must be a positive number.");
  }
  return Math.round(value * 100) / 100;
}

function parseDateOnly(raw: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
  if (!match) return new Date();
  const [, year, month, day] = match;
  return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
}

async function parseReceipt(formData: FormData) {
  const file = formData.get("receipt");
  if (!(file instanceof File) || file.size === 0) return null;
  if (!file.type.startsWith("image/")) {
    throw new Error("Receipt must be an image file.");
  }
  const arrayBuffer = await file.arrayBuffer();
  return { receiptImage: Buffer.from(arrayBuffer), receiptMimeType: file.type };
}

async function schoolYearWithAccess(schoolYearId: string, userId: string) {
  const schoolYear = await prisma.schoolYear.findUnique({
    where: { id: schoolYearId },
  });
  if (!schoolYear) throw new Error("School year not found.");
  await assertSchoolAccess(schoolYear.schoolId, userId);
  return schoolYear;
}

async function resolveCategoryId(
  schoolYearId: string,
  formData: FormData
): Promise<string | null> {
  const raw = String(formData.get("categoryId") ?? "").trim();
  if (!raw) return null;
  const category = await prisma.budgetCategory.findUnique({
    where: { id: raw },
  });
  if (!category || category.schoolYearId !== schoolYearId) {
    throw new Error("That category doesn't belong to this school year.");
  }
  return category.id;
}

export async function addExpense(schoolYearId: string, formData: FormData) {
  const user = await requireUser();
  const schoolYear = await schoolYearWithAccess(schoolYearId, user.id);
  if (schoolYear.closedAt) throw new Error("This school year is closed.");

  const amount = parseAmount(formData.get("amount"));
  const item = String(formData.get("item") ?? "").trim();
  const vendor = String(formData.get("vendor") ?? "").trim();
  const spentAtRaw = String(formData.get("spentAt") ?? "");

  if (!item) throw new Error("What was purchased is required.");
  if (!vendor) throw new Error("Who it was purchased from is required.");

  const spentAt = spentAtRaw ? parseDateOnly(spentAtRaw) : new Date();
  const receipt = await parseReceipt(formData);
  const categoryId = await resolveCategoryId(schoolYearId, formData);

  await prisma.expense.create({
    data: {
      schoolYearId,
      categoryId,
      amount,
      item,
      vendor,
      spentAt,
      enteredById: user.id,
      receiptImage: receipt?.receiptImage,
      receiptMimeType: receipt?.receiptMimeType,
    },
  });

  revalidatePath(`/school/${schoolYear.schoolId}`);
}

export async function updateExpense(
  expenseId: string,
  schoolYearId: string,
  formData: FormData
) {
  const user = await requireUser();
  const schoolYear = await schoolYearWithAccess(schoolYearId, user.id);
  if (schoolYear.closedAt) throw new Error("This school year is closed.");

  const amount = parseAmount(formData.get("amount"));
  const item = String(formData.get("item") ?? "").trim();
  const vendor = String(formData.get("vendor") ?? "").trim();
  const spentAtRaw = String(formData.get("spentAt") ?? "");

  if (!item) throw new Error("What was purchased is required.");
  if (!vendor) throw new Error("Who it was purchased from is required.");

  const receipt = await parseReceipt(formData);
  const categoryId = await resolveCategoryId(schoolYearId, formData);

  await prisma.expense.update({
    where: { id: expenseId, schoolYearId },
    data: {
      amount,
      item,
      vendor,
      categoryId,
      spentAt: spentAtRaw ? parseDateOnly(spentAtRaw) : undefined,
      updatedById: user.id,
      updatedAt: new Date(),
      ...(receipt && {
        receiptImage: receipt.receiptImage,
        receiptMimeType: receipt.receiptMimeType,
      }),
    },
  });

  revalidatePath(`/school/${schoolYear.schoolId}`);
}

export async function deleteExpense(expenseId: string, schoolYearId: string) {
  const user = await requireUser();
  const schoolYear = await schoolYearWithAccess(schoolYearId, user.id);
  if (schoolYear.closedAt) throw new Error("This school year is closed.");

  await prisma.expense.delete({ where: { id: expenseId, schoolYearId } });

  revalidatePath(`/school/${schoolYear.schoolId}`);
}

export async function updateStartingBalance(
  schoolYearId: string,
  formData: FormData
) {
  const user = await requireUser();
  const schoolYear = await schoolYearWithAccess(schoolYearId, user.id);
  if (schoolYear.closedAt) throw new Error("This school year is closed.");

  const raw = Number(formData.get("startingBalance"));
  if (!Number.isFinite(raw)) throw new Error("Starting balance must be a number.");
  const startingBalance = Math.round(raw * 100) / 100;

  await prisma.schoolYear.update({
    where: { id: schoolYearId },
    data: { startingBalance },
  });

  revalidatePath(`/school/${schoolYear.schoolId}`);
}
