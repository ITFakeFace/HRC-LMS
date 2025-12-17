import { PrismaClient } from '@prisma/client';
import { seedAccounts } from './seeders/account.seeder';
import { seedCourses } from './seeders/course.seeder';

const prisma = new PrismaClient();

async function main() {
  console.log('====== BẮT ĐẦU SEEDING DATABASE ======');

  try {
    // 1. Chạy Account Seeder (User, Role, Permission)
    await seedAccounts(prisma);
    console.log('\n');

    // 2. Chạy Course Seeder
    await seedCourses(prisma);
    console.log('\n');
    
  } catch (error) {
    console.error('Lỗi xảy ra trong quá trình seeding:', error);
    process.exit(1);
  }

  console.log('====== KẾT THÚC SEEDING ======');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });