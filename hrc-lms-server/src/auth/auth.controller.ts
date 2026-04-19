// src/auth/auth.controller.ts
import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  HttpStatus,
  HttpCode,
  ValidationPipe,
  UsePipes,
  Get,
} from '@nestjs/common';
import { AuthService } from './auth.service';

// Guards
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LoginDto } from './dto/login.dto/login.dto';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { RegisterDto } from './dto/register.dto/register.dto';
import { ResponseModel } from 'src/response-model/model/response-model.model';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';

@Controller('auth')
// Áp dụng ValidationPipe cho toàn bộ controller
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto): Promise<ResponseModel> {
    const result = await this.authService.login(
      loginDto.email,
      loginDto.password,
    );
    if (result.errors.length > 0) {
      return new ResponseModel({
        status: false,
        errors: result.errors,
        message: 'Failed',
        statusCode: 500,
        data: null,
      });
    }
    return new ResponseModel({
      status: true,
      errors: result.errors,
      message: 'Success',
      statusCode: 500,
      data: result,
    });
  }

  // Endpoint được bảo vệ bằng Access Token
  @UseGuards(JwtAuthGuard)
  @Post('profile')
  getProfile(@Request() req) {
    // req.user chứa thông tin từ JwtStrategy
    return req.user;
  }

  // Endpoint làm mới Token
  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshTokens(@Request() req) {
    // req.user chứa { userId, jti, user } từ JwtRefreshStrategy
    return this.authService.refreshTokens(req.user);
  }

  // 👇 API /me
  @UseGuards(JwtAuthGuard) // 1. Bắt buộc phải có Token hợp lệ
  @Get('me')
  async getMe(@CurrentUser() userPayload: any) {
    // userPayload là dữ liệu lấy từ Token (decoded)
    // Thường chứa: { sub: 1, email: '...', ... }

    console.log('Token payload:', userPayload); // Debug chơi

    // 2. Gọi Service để lấy data mới nhất từ DB dựa vào ID
    const userData = await this.authService.getMe(userPayload.id); // 'sub' thường là userId

    // 3. Trả về đúng cấu trúc Frontend cần
    return new ResponseModel({
      status: true,
      statusCode: 200,
      message: 'Success',
      data: userData, // Chỉ trả về UserData, không kèm Token
    });
  }
}
