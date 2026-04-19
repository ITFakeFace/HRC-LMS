import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

// 1. Hàm helper để tạo slug từ tiếng Việt
function stringToSlug(str: string) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/([^0-9a-z-\s])/g, '')
    .replace(/(\s+)/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export const seedCourses = async (prisma: PrismaClient) => {
  console.log('--- SEEDING COURSES (FROM JSON) ---');

  // A. LẤY ADMIN USER
  const adminUser = await prisma.user.findFirst({
    where: { username: 'superadmin' },
  });

  if (!adminUser) {
    throw new Error('Không tìm thấy Admin User. Hãy chạy seed account trước.');
  }

  // B. ĐỌC DỮ LIỆU TỪ JSON
  // Đường dẫn tương đối từ file seeder đến file JSON
  const dataPath = path.join(__dirname, 'data', 'course_data.json');

  try {
    const fileContent = fs.readFileSync(dataPath, 'utf-8');
    const coursesData = JSON.parse(fileContent);

    console.log(`\t[i] Found ${coursesData.length} courses in JSON file.`);

    await Promise.all(
      coursesData.map(async (courseData: any) => {
        // C. LOGIC TRANSFORM (Object -> Array cho contents)
        let transformedContents: any = courseData.contents;

        // Kiểm tra nếu là Object kiểu {'buổi 1': [...]} thì chuyển sang Array
        if (
          courseData.contents &&
          !Array.isArray(courseData.contents) &&
          typeof courseData.contents === 'object'
        ) {
          transformedContents = Object.keys(courseData.contents).map((key) => ({
            title: key,
            topics: courseData.contents[key],
          }));
        }

        // D. TẠO SLUG
        const slug = stringToSlug(courseData.name);

        // E. CHUẨN BỊ PAYLOAD
        const coursePayload = {
          name: courseData.name,
          code: courseData.code,
          slug: slug,

          objectives: courseData.objectives,
          audiences: courseData.audiences,
          requirements: courseData.requirements,
          duration: courseData.duration,
          schedule: courseData.schedule,
          locations: courseData.locations,
          instructors: courseData.instructors,
          coverImage: courseData.coverImage,
          assessment: courseData.assessment,
          materials: courseData.materials,
          contents: transformedContents,

          creator: {
            connect: { id: adminUser.id },
          },
        };

        // F. UPSERT VÀO DB
        await prisma.course.upsert({
          where: { code: courseData.code },
          update: coursePayload,
          create: coursePayload,
        });

        console.log(`\t[✔] Course '${courseData.code}' seeded.`);
      }),
    );
  } catch (error) {
    console.error(`\t[x] Error reading or parsing course_data.json:`, error);
  }
};
