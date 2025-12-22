import { ClassShift, ClassStatus } from '@prisma/client';

export class ClassDto {
  id: number;
  code: string;
  name: string;
  startDate: Date;
  endDate: Date | null;
  totalSessions: number;
  shift: ClassShift;
  startTime: string;
  endTime: string;
  status: ClassStatus;
  courseId: number;
  lecturerId: number | null;
}