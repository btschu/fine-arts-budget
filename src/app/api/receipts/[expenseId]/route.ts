import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ expenseId: string }> }
) {
  const { expenseId } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const expense = await prisma.expense.findUnique({
    where: { id: expenseId },
    select: {
      receiptImage: true,
      receiptMimeType: true,
      schoolYear: { select: { schoolId: true } },
    },
  });
  if (!expense || !expense.receiptImage) {
    return new NextResponse("Not found", { status: 404 });
  }

  const membership = await prisma.membership.findUnique({
    where: {
      userId_schoolId: {
        userId: session.user.id,
        schoolId: expense.schoolYear.schoolId,
      },
    },
  });
  if (!membership) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  return new NextResponse(new Uint8Array(expense.receiptImage), {
    headers: {
      "Content-Type": expense.receiptMimeType ?? "image/jpeg",
      "Cache-Control": "private, max-age=3600",
    },
  });
}
