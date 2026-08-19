"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { requireUser, getMySchools, assertAdmin } from "@/lib/authz";

export async function addTeacher(formData: FormData) {
  const actor = await requireUser();
  await assertAdmin(actor.id);
  const mySchools = await getMySchools(actor.id);
  const mySchoolIds = new Set(mySchools.map((s) => s.id));

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const requestedSchoolIds = formData.getAll("schoolIds").map(String);
  const schoolIds = requestedSchoolIds.filter((id) => mySchoolIds.has(id));

  if (!email) throw new Error("Email is required.");
  if (schoolIds.length === 0) {
    throw new Error("Select at least one school you belong to.");
  }

  let user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    if (!name) throw new Error("Name is required for a new teacher.");
    if (!password || password.length < 8) {
      throw new Error("New teachers need a temporary password (8+ characters).");
    }
    const passwordHash = await bcrypt.hash(password, 10);
    user = await prisma.user.create({
      data: { name, email, passwordHash },
    });
  }

  await Promise.all(
    schoolIds.map((schoolId) =>
      prisma.membership.upsert({
        where: { userId_schoolId: { userId: user!.id, schoolId } },
        update: {},
        create: { userId: user!.id, schoolId },
      })
    )
  );

  revalidatePath("/settings");
}

export async function setMemberships(userId: string, formData: FormData) {
  const actor = await requireUser();
  await assertAdmin(actor.id);

  const mySchools = await getMySchools(actor.id);
  const mySchoolIds = mySchools.map((s) => s.id);

  const desiredSchoolIds = new Set(
    formData
      .getAll("schoolIds")
      .map(String)
      .filter((id) => mySchoolIds.includes(id))
  );

  const currentMemberships = await prisma.membership.findMany({
    where: { userId, schoolId: { in: mySchoolIds } },
  });
  const currentSchoolIds = new Set(currentMemberships.map((m) => m.schoolId));

  const toAdd = mySchoolIds.filter(
    (id) => desiredSchoolIds.has(id) && !currentSchoolIds.has(id)
  );
  const toRemove = mySchoolIds.filter(
    (id) => !desiredSchoolIds.has(id) && currentSchoolIds.has(id)
  );

  await prisma.$transaction([
    ...toAdd.map((schoolId) =>
      prisma.membership.create({ data: { userId, schoolId } })
    ),
    ...toRemove.map((schoolId) =>
      prisma.membership.delete({
        where: { userId_schoolId: { userId, schoolId } },
      })
    ),
  ]);

  revalidatePath("/settings");
}

export async function deleteTeacherAccount(userId: string) {
  const actor = await requireUser();
  await assertAdmin(actor.id);

  if (userId === actor.id) {
    throw new Error("You can't delete your own account.");
  }

  const mySchools = await getMySchools(actor.id);
  const mySchoolIds = new Set(mySchools.map((s) => s.id));

  const allMemberships = await prisma.membership.findMany({ where: { userId } });
  const outsideMemberships = allMemberships.filter(
    (m) => !mySchoolIds.has(m.schoolId)
  );
  if (outsideMemberships.length > 0) {
    throw new Error(
      "This teacher also belongs to a school you don't manage — remove their access to your schools instead of deleting the account."
    );
  }

  const expenseCount = await prisma.expense.count({
    where: { OR: [{ enteredById: userId }, { updatedById: userId }] },
  });
  if (expenseCount > 0) {
    throw new Error(
      "This teacher has logged or edited purchases, so deleting the account would break the record of who spent what. Remove their school access instead to revoke login without losing history."
    );
  }

  await prisma.user.delete({ where: { id: userId } });

  revalidatePath("/settings");
}

export async function resetTeacherPassword(userId: string): Promise<string> {
  const actor = await requireUser();
  await assertAdmin(actor.id);

  const mySchools = await getMySchools(actor.id);
  const mySchoolIds = new Set(mySchools.map((s) => s.id));

  const memberships = await prisma.membership.findMany({ where: { userId } });
  if (!memberships.some((m) => mySchoolIds.has(m.schoolId))) {
    throw new Error("You don't manage a school this teacher belongs to.");
  }

  const tempPassword = randomBytes(9).toString("base64url");
  const passwordHash = await bcrypt.hash(tempPassword, 10);

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });

  return tempPassword;
}

export async function setAdmin(userId: string, makeAdmin: boolean) {
  const actor = await requireUser();
  await assertAdmin(actor.id);

  await prisma.user.update({
    where: { id: userId },
    data: { isAdmin: makeAdmin },
  });

  revalidatePath("/settings");
}

export async function changePassword(
  _prevState: { error: string | null; success: boolean },
  formData: FormData
): Promise<{ error: string | null; success: boolean }> {
  const actor = await requireUser();

  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");

  if (newPassword.length < 8) {
    return { error: "New password must be at least 8 characters.", success: false };
  }

  const user = await prisma.user.findUnique({ where: { id: actor.id } });
  if (!user) return { error: "User not found.", success: false };

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) {
    return { error: "Current password is incorrect.", success: false };
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: actor.id },
    data: { passwordHash },
  });

  return { error: null, success: true };
}
