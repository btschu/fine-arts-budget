import { requireUser, getMySchools, isAdmin } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import AddTeacherForm from "@/components/AddTeacherForm";
import AddSchoolForm from "@/components/AddSchoolForm";
import ManageMemberModal from "@/components/ManageMemberModal";
import AdminToggle from "@/components/AdminToggle";
import ChangePasswordForm from "@/components/ChangePasswordForm";

export default async function SettingsPage() {
  const user = await requireUser();
  const schools = await getMySchools(user.id);
  const admin = await isAdmin(user.id);

  const memberships = await prisma.membership.findMany({
    where: { schoolId: { in: schools.map((s) => s.id) } },
    include: { user: true },
    orderBy: { user: { name: "asc" } },
  });

  const teacherMap = new Map<
    string,
    {
      id: string;
      name: string;
      email: string;
      isAdmin: boolean;
      schoolIds: string[];
    }
  >();
  for (const m of memberships) {
    const entry = teacherMap.get(m.user.id) ?? {
      id: m.user.id,
      name: m.user.name,
      email: m.user.email,
      isAdmin: m.user.isAdmin,
      schoolIds: [],
    };
    entry.schoolIds.push(m.schoolId);
    teacherMap.set(m.user.id, entry);
  }
  const teachers = Array.from(teacherMap.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  const schoolOptions = schools.map((s) => ({ id: s.id, name: s.name }));

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:py-10">
      <h1 className="mb-6 text-2xl font-semibold text-slate-900">Settings</h1>

      <div className="flex flex-col gap-8">
        <ChangePasswordForm />

        {admin && <AddSchoolForm />}

        {schools.length === 0 ? (
          <p className="text-slate-500">
            You&apos;re not assigned to a school yet, so there&apos;s
            nothing else to manage here.
          </p>
        ) : (
          <>
            {admin && <AddTeacherForm schools={schoolOptions} />}

            <div>
              <h2 className="mb-3 font-medium text-slate-900">Teachers</h2>
              <div className="flex flex-col gap-2">
                {teachers.map((teacher) => (
                  <div
                    key={teacher.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-900">
                        {teacher.name}
                      </p>
                      <p className="truncate text-sm text-slate-500">
                        {teacher.email}
                      </p>
                      <p className="truncate text-xs text-slate-400">
                        {schoolOptions
                          .filter((s) => teacher.schoolIds.includes(s.id))
                          .map((s) => s.name)
                          .join(", ")}
                      </p>
                    </div>
                    {admin && (
                      <div className="flex items-center gap-4">
                        <AdminToggle
                          userId={teacher.id}
                          isAdmin={teacher.isAdmin}
                        />
                        <ManageMemberModal
                          memberId={teacher.id}
                          memberName={teacher.name}
                          memberEmail={teacher.email}
                          schools={schoolOptions}
                          currentSchoolIds={teacher.schoolIds}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
