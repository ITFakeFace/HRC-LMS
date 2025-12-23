import { SessionStatus } from '@prisma/client';

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
}