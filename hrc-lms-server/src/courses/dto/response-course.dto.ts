import { ErrorsModel } from 'src/response-model/model/errors-model.mdel';
import { CourseDto } from './course.dto';

export class ResponseCourseDto extends ErrorsModel {
  course: CourseDto | null = null;
}