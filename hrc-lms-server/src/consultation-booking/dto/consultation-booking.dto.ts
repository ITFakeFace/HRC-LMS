import { BookingStatus } from './booking-status.enum'; // Enum bạn đã tạo trước đó

export class ConsultationBookingDto {
  id: number;
  fullname: string;
  phone: string | null;
  email: string | null;
  method: string;
  time: Date;
  destination: string | null;
  status: BookingStatus;
  adminNotes: string | null;
  createdAt: Date;
  updatedAt: Date;
}
