import { ErrorsModel } from 'src/response-model/model/errors-model.mdel';
import { ConsultationBookingDto } from './consultation-booking.dto';

export class ResponseConsultationBookingDto extends ErrorsModel {
  // Mặc định là null, nếu thành công sẽ gán data vào đây
  booking: ConsultationBookingDto | null = null;
}
