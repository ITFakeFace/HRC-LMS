import { PrismaClient, ClassShift, ClassStatus, SessionStatus, EnrollmentStatus, Prisma } from '@prisma/client';

// =============================================================================
// HELPER: TẠO LỊCH HỌC TỰ ĐỘNG
// =============================================================================
function generateSessionsData(
  startDate: Date,
  totalSessions: number,
  shift: ClassShift,
  startTimeStr: string = '18:00',
  endTimeStr: string = '21:30'
): Prisma.ClassSessionCreateWithoutClassInput[] { // <--- (Optional) Định nghĩa kiểu trả về
  
  // --- SỬA LỖI TẠI ĐÂY ---
  // Thay vì: const sessions = []; 
  // Hãy dùng:
  const sessions: Prisma.ClassSessionCreateWithoutClassInput[] = []; 

  let currentDate = new Date(startDate);
  let count = 0;

  // MWF: Thứ 2(1), 4(3), 6(5) | TTS: Thứ 3(2), 5(4), 7(6)
  const validDays = shift === ClassShift.MWF_EVENING ? [1, 3, 5] : [2, 4, 6];
  const [startH, startM] = startTimeStr.split(':').map(Number);
  const [endH, endM] = endTimeStr.split(':').map(Number);

  while (count < totalSessions) {
    const dayOfWeek = currentDate.getDay();

    if (validDays.includes(dayOfWeek)) {
      const startDateTime = new Date(currentDate);
      startDateTime.setHours(startH, startM, 0, 0);

      const endDateTime = new Date(currentDate);
      endDateTime.setHours(endH, endM, 0, 0);

      sessions.push({
        sessionNumber: count + 1,
        date: new Date(currentDate),
        startTime: startDateTime,
        endTime: endDateTime,
        title: `Buổi học số ${count + 1}`,
        status: SessionStatus.SCHEDULED,
        isAttendanceOpen: false,
      });

      count++;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return sessions;
}

// =============================================================================
// MAIN CLASS SEEDER
// =============================================================================
export const seedClasses = async (prisma: PrismaClient) => {
  console.log('--- SEEDING CLASSES & SESSIONS (LOGIC: TEACHER FULL TUẦN) ---');

  // 1. LẤY DATA USER & COURSE
  const teacher1 = await prisma.user.findUnique({ where: { username: 'teacher1' } });
  const teacher2 = await prisma.user.findUnique({ where: { username: 'teacher2' } });

  const student1 = await prisma.user.findUnique({ where: { username: 'student1' } });
  const student2 = await prisma.user.findUnique({ where: { username: 'student2' } });
  const student3 = await prisma.user.findUnique({ where: { username: 'student3' } });

  if (!teacher1 || !teacher2 || !student1 || !student2 || !student3) {
    throw new Error('Thiếu dữ liệu Users. Hãy chạy account.seeder trước.');
  }

  const courseRS = await prisma.course.findUnique({ where: { code: 'HRC-RS01' } }); // Tuyển dụng
  const courseCB = await prisma.course.findUnique({ where: { code: 'HRC-CB' } });   // C&B
  const courseP0 = await prisma.course.findUnique({ where: { code: 'HRC-P0' } });   // Nhân tướng

  if (!courseRS || !courseCB || !courseP0) {
    throw new Error('Thiếu dữ liệu Course. Hãy chạy course.seeder trước.');
  }

  // 2. ĐỊNH NGHĨA 4 LỚP (MỖI GV DẠY 2 LỚP XEN KẼ CA)
  
  const classesToSeed = [
    // --- GIÁO VIÊN 1 (Full tuần) ---
    {
      // GV1 - Thứ 2-4-6
      code: 'CLASS-RS-K01',
      name: 'Tuyển dụng K01 (GV1 - 2/4/6)',
      courseId: courseRS.id,
      lecturerId: teacher1.id,
      shift: ClassShift.MWF_EVENING,
      totalSessions: 10,
      students: [student1.id, student2.id], // SV 1, 2
    },
    {
      // GV1 - Thứ 3-5-7
      code: 'CLASS-CB-K01',
      name: 'C&B K01 (GV1 - 3/5/7)',
      courseId: courseCB.id,
      lecturerId: teacher1.id,
      shift: ClassShift.TTS_EVENING,
      totalSessions: 16,
      students: [student2.id, student3.id], // SV 2, 3
    },

    // --- GIÁO VIÊN 2 (Full tuần) ---
    {
      // GV2 - Thứ 2-4-6 (Khác lớp GV1 nhưng cùng giờ, dạy môn khác)
      code: 'CLASS-P0-K01',
      name: 'Nhân tướng học K01 (GV2 - 2/4/6)',
      courseId: courseP0.id,
      lecturerId: teacher2.id,
      shift: ClassShift.MWF_EVENING,
      totalSessions: 4,
      students: [student1.id, student3.id], // SV 1, 3
    },
    {
      // GV2 - Thứ 3-5-7
      code: 'CLASS-RS-K02',
      name: 'Tuyển dụng K02 (GV2 - 3/5/7)',
      courseId: courseRS.id,
      lecturerId: teacher2.id,
      shift: ClassShift.TTS_EVENING,
      totalSessions: 10,
      students: [student1.id, student2.id, student3.id], // Cả 3 SV
    }
  ];

  // 3. THỰC THI SEED
  // Ngày bắt đầu chung là Hôm nay
  const commonStartDate = new Date();

  for (const cls of classesToSeed) {
    // Tạo lịch học
    const sessionsData = generateSessionsData(
      commonStartDate,
      cls.totalSessions,
      cls.shift
    );

    // Upsert Class
    const createdClass = await prisma.class.upsert({
      where: { code: cls.code },
      update: {
        lecturerId: cls.lecturerId,
        status: ClassStatus.ACTIVE,
      },
      create: {
        code: cls.code,
        name: cls.name,
        startDate: commonStartDate,
        totalSessions: cls.totalSessions,
        shift: cls.shift,
        startTime: '18:00',
        endTime: '21:30',
        status: ClassStatus.ACTIVE,
        course: { connect: { id: cls.courseId } },
        lecturer: { connect: { id: cls.lecturerId } },
        sessions: {
          create: sessionsData
        }
      },
    });

    console.log(`\t[✔] Class '${cls.name}' seeded.`);

    // Upsert Enrollment
    for (const stdId of cls.students) {
      await prisma.enrollment.upsert({
        where: {
          studentId_classId: { studentId: stdId, classId: createdClass.id }
        },
        update: {},
        create: {
          studentId: stdId,
          classId: createdClass.id,
          status: EnrollmentStatus.LEARNING,
          joinedAt: new Date(),
        }
      });
    }
  }

  console.log('✅ 4 Classes seeded. Teachers are now fully booked!');
};