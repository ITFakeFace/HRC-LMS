import { User } from '@prisma/client';
import { UserDto } from '../dto/user.dto';

export class UserMapper {
  static fromModelToDto(model: User): UserDto {
    const res: UserDto = {
      id: model.id,
      pID: model.pID,
      username: model.username,
      phone: model.phone,
      email: model.email,
      avatar: model.avatar,
      fullname: model.fullname,
      gender: model.gender,
      dob: model.dob,
      lockoutEnd: model.lockoutEnd,
      isEmailVerified: model.isEmailVerified,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
      roles: [],
      permissions: [],
    };

    return res;
  }
  static fromModelListToDtoList(models: User[]): UserDto[] {
    return models.map((model) => this.fromModelToDto(model));
  }
}
