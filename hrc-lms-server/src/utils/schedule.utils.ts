import { ClassShift, SessionStatus, Prisma } from '@prisma/client'; // 1. Import Prisma

export class ScheduleUtils {
  static generateSessions(
    startDate: Date,
    totalSessions: number,
    shift: ClassShift,
    startTimeStr: string = '18:00',
    endTimeStr: string = '21:30'
  ): Prisma.ClassSessionCreateWithoutClassInput[] { // 2. Định nghĩa kiểu trả về
    
    // 3. QUAN TRỌNG: Định nghĩa kiểu cho mảng ngay lúc khởi tạo
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
        // Tạo giờ bắt đầu
        const startDateTime = new Date(currentDate);
        startDateTime.setHours(startH, startM, 0, 0);

        // Tạo giờ kết thúc
        const endDateTime = new Date(currentDate);
        endDateTime.setHours(endH, endM, 0, 0);

        // Push vào mảng (Lúc này TS đã hiểu kiểu dữ liệu nên không báo lỗi never nữa)
        sessions.push({
          sessionNumber: count + 1,
          date: new Date(currentDate),
          startTime: startDateTime,
          endTime: endDateTime,
          title: `Buổi học số ${count + 1}`,
          status: SessionStatus.SCHEDULED,
          isAttendanceOpen: false,
          // Các trường optional khác không bắt buộc phải khai báo nếu không cần
        });

        count++;
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return sessions;
  }
}