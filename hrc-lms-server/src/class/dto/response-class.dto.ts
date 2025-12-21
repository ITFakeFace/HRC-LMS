
import { ErrorsModel } from 'src/response-model/model/errors-model.mdel';
import { ClassDto } from './class.dto';

export class ResponseClassDto extends ErrorsModel {
  classData: ClassDto | null = null;
}