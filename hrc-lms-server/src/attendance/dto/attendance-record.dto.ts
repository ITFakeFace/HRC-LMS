import { AttendanceStatus } from '@prisma/client';

export class AttendanceRecordDto {
  id: number;
  sessionId: number;
  stdId: number;
  status: AttendanceStatus;
  note: string | null;
  checkInAt: Date | null;
}