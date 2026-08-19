import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const CURRENT_YEAR_LABEL = "2026-2027";

async function ensureActiveYear(schoolId: string) {
  const existing = await prisma.schoolYear.findFirst({
    where: { schoolId, closedAt: null },
  });
  if (existing) return existing;

  return prisma.schoolYear.create({
    data: {
      schoolId,
      label: CURRENT_YEAR_LABEL,
      startingBalance: 0,
    },
  });
}

async function main() {
  const south = await prisma.school.upsert({
    where: { name: "South High School" },
    update: {},
    create: { name: "South High School" },
  });

  const johnson = await prisma.school.upsert({
    where: { name: "Johnson Junior High School" },
    update: {},
    create: { name: "Johnson Junior High School" },
  });

  await ensureActiveYear(south.id);
  await ensureActiveYear(johnson.id);

  const email = "brandon.schumacher@laramie1.org";
  const existing = await prisma.user.findUnique({ where: { email } });

  let tempPassword: string | null = null;

  if (!existing) {
    tempPassword = randomBytes(9).toString("base64url");
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    const user = await prisma.user.create({
      data: {
        name: "Brandon Schumacher",
        email,
        passwordHash,
        isAdmin: true,
      },
    });

    await prisma.membership.createMany({
      data: [
        { userId: user.id, schoolId: south.id },
        { userId: user.id, schoolId: johnson.id },
      ],
    });
  }

  console.log("Seed complete.");
  console.log(`Schools: ${south.name}, ${johnson.name}`);
  console.log(`Active school year: ${CURRENT_YEAR_LABEL}`);
  if (tempPassword) {
    console.log(`\nLogin: ${email}`);
    console.log(`Temporary password: ${tempPassword}`);
  } else {
    console.log(`\nUser ${email} already exists — left untouched.`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
