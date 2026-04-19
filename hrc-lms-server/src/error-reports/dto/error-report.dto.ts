import { Expose, Type } from 'class-transformer';
import { RequestStatus } from '@prisma/client';

class UserShortDto {
  @Expose() id: number;
  @Expose() fullname: string;
  @Expose() email: string;
  @Expose() username: string;
}

export class ErrorReportDto {
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
  adminReply: string | null;

  @Expose()
  createdAt: Date;

  @Expose()
  resolvedAt: Date | null;

  @Expose()
  userId: number;

  @Expose()
  @Type(() => UserShortDto)
  user: UserShortDto;
}