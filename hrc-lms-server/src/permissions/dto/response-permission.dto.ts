import { ResponseError } from 'src/response-model/model/response-model.model';
import { PermissionDto } from './permission.dto';
import { ErrorsModel } from 'src/response-model/model/errors-model.mdel';

export class ResponsePermissionDto extends ErrorsModel {
  permission?: PermissionDto | null;
}
