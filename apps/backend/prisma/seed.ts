import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const hashedPassword = await bcrypt.hash('Admin@123', 12);

  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@school.edu.np' },
    update: {},
    create: {
      email: 'admin@school.edu.np',
      password: hashedPassword,
      role: Role.SUPER_ADMIN,
    },
  });

  console.log('Super Admin created:', superAdmin.email);

  await prisma.schoolSettings.upsert({
    where: { id: '1' },
    update: {},
    create: {
      id: '1',
      schoolName: 'My School',
      primaryColor: '#1e40af',
      accentColor: '#3b82f6',
    },
  });

  console.log('School settings initialized.');

  const academicYear = await prisma.academicYear.upsert({
    where: { name: '2081-2082' },
    update: {},
    create: {
      name: '2081-2082',
      startDate: new Date('2024-04-14'),
      endDate: new Date('2025-04-13'),
      isCurrent: true,
    },
  });

  console.log('Academic year created:', academicYear.name);
  console.log('\nSeed complete!');
  console.log('Login: admin@school.edu.np / Admin@123');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
