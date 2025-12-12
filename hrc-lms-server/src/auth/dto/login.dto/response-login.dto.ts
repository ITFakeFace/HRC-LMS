import { ErrorsModel } from 'src/response-model/model/errors-model.mdel';
import { ResponseError } from 'src/response-model/model/response-model.model';
import { UserDto } from 'src/users/dto/user.dto';

export class ResponseLoginDto extends ErrorsModel {
  accessToken: string | null;
  refreshToken: string | null;
  user: UserDto | null;
}
