"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { requireUser, assertAdmin, VIEW_AS_TEACHER_COOKIE } from "@/lib/authz";

export async function enableViewAsTeacher() {
  const user = await requireUser();
  await assertAdmin(user.id);

  const store = await cookies();
  store.set(VIEW_AS_TEACHER_COOKIE, "1", {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
  });

  revalidatePath("/", "layout");
}

export async function disableViewAsTeacher() {
  await requireUser();

  const store = await cookies();
  store.delete(VIEW_AS_TEACHER_COOKIE);

  revalidatePath("/", "layout");
}
