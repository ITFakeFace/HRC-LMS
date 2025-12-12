// src/users/dto/create-user.dto.ts
import {
  IsNotEmpty,
  IsString,
  IsEmail,
  MinLength,
  MaxLength,
  IsBoolean,
  IsDateString,
  IsOptional,
  Matches,
  IsIn,
  ArrayUnique,
  ArrayMinSize,
  IsArray,
  IsNumber,
} from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(12)
  pID: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  username: string;

  @IsOptional()
  @IsString()
  @Matches(/^[0-9]{10}$/)
  phone?: string;

  @IsNotEmpty()
  @IsEmail()
  @MaxLength(100)
  email: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  @MaxLength(255)
  password: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  fullname: string;

  @IsBoolean()
  gender: boolean;

  @IsNotEmpty()
  @IsDateString()
  dob: string;

  @IsArray({ message: 'Roles must be array of number' })
  @ArrayUnique({ message: 'Roles cannot be ' })
  roles: number[];
}
