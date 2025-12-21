import { PartialType } from '@nestjs/mapped-types'; // Sử dụng mapped-types thay vì swagger
import { CreateClassDto } from './create-class.dto';

export class UpdateClassDto extends PartialType(CreateClassDto) {}