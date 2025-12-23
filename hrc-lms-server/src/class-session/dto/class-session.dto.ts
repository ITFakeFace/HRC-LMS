import { SessionStatus } from "@prisma/client";

export class ClassSessionDto {
  id: number;
  classId: number;
  sessionNumber: number;
  date: Date;
  startTime: Date;
  endTime: Date;
  title: string | null;
  description: string | null;
  status: SessionStatus;
  
  isAttendanceOpen: boolean;
  openedBy: number | null;

  // 👇 THÊM TRƯỜNG NÀY (Bắt buộc để Mobile vẽ QR)
  attendanceCode: string | null; 

  // (Optional) Thêm trường này nếu bạn muốn hiển thị nhanh số lượng đã điểm danh
  // attendedCount?: number; 
}