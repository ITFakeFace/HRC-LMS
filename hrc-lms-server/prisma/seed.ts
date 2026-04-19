import { PrismaClient } from '@prisma/client';
import { seedAccounts } from './seeders/account.seeder';
import { seedCourses } from './seeders/course.seeder';
import { seedClasses } from './seeders/class.seeder'; // <--- Import thêm cái này

const prisma = new PrismaClient();

async function main() {
  console.log('====== BẮT ĐẦU SEEDING DATABASE ======');

  try {
    // 1. Chạy Account Seeder (User, Role, Permission)
    // Tạo Admin, Giáo viên, Học sinh
    await seedAccounts(prisma);
    console.log('\n');

    // 2. Chạy Course Seeder
    // Tạo các khóa học mẫu
    await seedCourses(prisma);
    console.log('\n');

    // 3. Chạy Class Seeder (MỚI THÊM)
    // Tạo Lớp học, tự động sinh ClassSession, và xếp Học sinh vào lớp
    await seedClasses(prisma);
    console.log('\n');
    
  } catch (error) {
    console.error('❌ Lỗi xảy ra trong quá trình seeding:', error);
    process.exit(1);
  }

  console.log('====== KẾT THÚC SEEDING THÀNH CÔNG ======');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });