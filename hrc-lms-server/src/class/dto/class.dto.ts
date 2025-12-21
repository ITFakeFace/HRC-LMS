import { ClassStatus } from '@prisma/client';

export class ClassDto {
  id: number;
  code: string;
  name: string;
  startDate: Date;
  endDate: Date | null;
  status: ClassStatus;
  courseId: number;
}