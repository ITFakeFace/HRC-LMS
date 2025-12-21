import { EnrollmentStatus } from '@prisma/client';

export class EnrollmentDto {
  id: number;
  studentId: number;
  classId: number;
  joinedAt: Date;
  status: EnrollmentStatus;
}