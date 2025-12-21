export class AttendanceSessionDto {
  id: number;
  classId: number;
  openBy: number;
  openAt: Date;
  closeAt: Date | null;
  code: string | null;
}