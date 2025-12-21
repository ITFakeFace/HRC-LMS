
import { ErrorsModel } from 'src/response-model/model/errors-model.mdel';
import { EnrollmentDto } from './enrollment.dto';

export class ResponseEnrollmentDto extends ErrorsModel {
  enrollment: EnrollmentDto | null = null;
}