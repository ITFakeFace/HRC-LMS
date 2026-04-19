// src/session/dto/response-session.dto.ts
import { ErrorsModel } from 'src/response-model/model/errors-model.mdel';
import { SessionDto } from './session.dto';

export class ResponseSessionDto extends ErrorsModel {
  // Trả về đối tượng session hoặc null nếu có lỗi
  session: SessionDto | null = null;

  // Các thông tin bổ sung cho phân trang (Pagination)
  total?: number;
  page?: number;
  limit?: number;
}
