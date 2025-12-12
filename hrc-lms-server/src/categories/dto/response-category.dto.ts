import { ErrorsModel } from "src/response-model/model/errors-model.mdel";
import { CategoryDto } from "./category.dto";

export class ResponseCategoryDto extends ErrorsModel {
  category: CategoryDto | null = null;
}