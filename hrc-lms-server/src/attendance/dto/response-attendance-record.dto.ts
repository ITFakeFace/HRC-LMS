import { ErrorsModel } from 'src/response-model/model/errors-model.mdel';
import { AttendanceRecordDto } from './attendance-record.dto';

export class ResponseAttendanceRecordDto extends ErrorsModel {
  record: AttendanceRecordDto | null = null;
}