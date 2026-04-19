import { ErrorsModel } from 'src/response-model/model/errors-model.mdel';
import { FormRequestDto } from './form-request.dto';

export class ResponseFormRequestDto extends ErrorsModel {
  formRequest: FormRequestDto | null = null;
}