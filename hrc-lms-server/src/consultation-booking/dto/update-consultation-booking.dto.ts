import { PartialType } from '@nestjs/mapped-types';
import { CreateConsultationBookingDto } from './create-consultation-booking.dto';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { BookingStatus } from './booking-status.enum';

export class UpdateConsultationBookingDto extends PartialType(
  CreateConsultationBookingDto,
) {
  @IsOptional()
  @IsEnum(BookingStatus, { message: 'Trạng thái không hợp lệ' })
  status?: BookingStatus;

  @IsOptional()
  @IsString()
  adminNotes?: string;
}
