export class SessionDto {
  id: number;
  AIEnable: boolean;
  isEnded: boolean;
  userId: number | null;

  // [NEW] Trả về object JSON trạng thái
  bookingState: any | null;

  createdAt: Date;
  updatedAt: Date;
}
