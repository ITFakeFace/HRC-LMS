
import { ErrorsModel } from 'src/response-model/model/errors-model.mdel';
import { AttendanceSessionDto } from './attendance-session.dto';

export class ResponseAttendanceSessionDto extends ErrorsModel {
  session: AttendanceSessionDto | null = null;
}