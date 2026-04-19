import { PartialType } from '@nestjs/mapped-types';
import { CreatePermissionDto } from './create-permission.dto';

export class UpdatePermissionDto extends PartialType(CreatePermissionDto) {
  // Nếu trong CreatePermissionDto có quy định @IsNotEmpty() cho id
  // Bạn nên xem lại CreatePermissionDto, thường khi tạo mới ta không gửi ID (ID tự tăng)
}
