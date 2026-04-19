import { ErrorsModel } from 'src/response-model/model/errors-model.mdel';
import { ErrorReportDto } from './error-report.dto';

export class ResponseErrorReportDto extends ErrorsModel {
  errorReport: ErrorReportDto | null = null;
}