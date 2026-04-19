import { Expose, Type } from 'class-transformer';
import { RequestStatus } from '@prisma/client';

// DTO nhỏ để map thông tin user gọn nhẹ, tránh lộ password
class UserShortDto {
  @Expose() id: number;
  @Expose() fullname: string;
  @Expose() email: string;
  @Expose() avatar: string;
}

export class FormRequestDto {
  @Expose()
  id: number;

  @Expose()
  title: string;

  @Expose()
  content: string;

  @Expose()
  image: string | null;

  @Expose()
  status: RequestStatus;

  @Expose()
  adminNote: string | null;

  @Expose()
  createdAt: Date;

  @Expose()
  resolvedAt: Date | null;

  @Expose()
  userId: number;

  // Map quan hệ User (nếu include trong repository)
  @Expose()
  @Type(() => UserShortDto)
  user: UserShortDto;
}