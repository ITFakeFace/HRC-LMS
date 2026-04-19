import { ErrorsModel } from 'src/response-model/model/errors-model.mdel';
import { ClassSessionDto } from './class-session.dto';

export class ResponseClassSessionDto extends ErrorsModel {
  session: ClassSessionDto | null = null;
}