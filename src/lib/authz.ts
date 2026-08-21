import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export const VIEW_AS_TEACHER_COOKIE = "viewAsTeacher";

export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  return session.user;
}

export async function getMySchools(userId: string) {
  return prisma.school.findMany({
    where: { memberships: { some: { userId } } },
    orderBy: { name: "asc" },
  });
}

export async function requireSchoolAccess(schoolId: string, userId: string) {
  const membership = await prisma.membership.findUnique({
    where: { userId_schoolId: { userId, schoolId } },
  });
  if (!membership) redirect("/");
}

export async function assertSchoolAccess(schoolId: string, userId: string) {
  const membership = await prisma.membership.findUnique({
    where: { userId_schoolId: { userId, schoolId } },
  });
  if (!membership) throw new Error("You don't have access to this school.");
}

export async function isAdmin(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isAdmin: true },
  });
  return user?.isAdmin ?? false;
}

export async function assertAdmin(userId: string) {
  if (!(await isAdmin(userId))) {
    throw new Error("Only an admin can do that.");
  }
}

export async function isViewingAsTeacher() {
  const store = await cookies();
  return store.get(VIEW_AS_TEACHER_COOKIE)?.value === "1";
}

// Whether admin-only UI should be shown. True admins can flip on
// "view as teacher" to preview the app without admin controls; this
// never affects the underlying permission checks in server actions.
export async function getDisplayAdmin(userId: string) {
  if (!(await isAdmin(userId))) return false;
  return !(await isViewingAsTeacher());
}

export async function getActiveSchoolYear(schoolId: string) {
  return prisma.schoolYear.findFirst({
    where: { schoolId, closedAt: null },
  });
}
