// src/users/users.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Prisma, User } from '@prisma/client';
import { UserRepository } from './user.repository';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserDto } from './dto/user.dto';
import { ResponseUserDto } from './dto/response-user.dto';
import { PermissionDto } from 'src/permissions/dto/permission.dto';
import { RoleRepository } from 'src/roles/role.repository';

@Injectable()
export class UsersService {
  constructor(
    private userRepository: UserRepository,
    private roleRepository: RoleRepository,
    private prisma: PrismaService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<ResponseUserDto> {
    const { roles: roleIds, password, ...userCoreData } = createUserDto;
    const res = new ResponseUserDto();

    // 1. === KIỂM TRA TỒN TẠI DỮ LIỆU @unique ===
    const existingEmail = await this.userRepository.findByEmail(
      userCoreData.email,
    );
    if (existingEmail) {
      res.pushError({ key: 'email', value: 'Email đã tồn tại.' });
    }
    // Cần thêm kiểm tra cho Username và pID
    const existingUsername = await this.userRepository.findByUsername(
      userCoreData.username,
    ); // Giả định có hàm findByUsername
    if (existingUsername) {
      res.pushError({ key: 'username', value: 'Username đã tồn tại.' });
    }
    const existingPID = await this.userRepository.findByPID(userCoreData.pID); // Giả định có hàm findByPID
    if (existingPID) {
      res.pushError({ key: 'pID', value: 'Mã định danh pID đã tồn tại.' });
    }

    // Nếu đã có lỗi validation, dừng lại và trả về ngay
    if (res.errors.length > 0) {
      return res;
    }

    // 2. === KIỂM TRA TỒN TẠI ROLES (RẤT QUAN TRỌNG) ===
    if (roleIds && roleIds.length > 0) {
      // Giả sử bạn có hàm findByIds trong RoleRepository
      // Nếu không có RoleRepository, bạn cần dùng this.prisma.role.findMany()
      const targetRoles = await this.prisma.role.findMany({
        where: { id: { in: roleIds } },
        select: { id: true },
      });

      // Nếu số lượng Role tìm được KHÔNG khớp với số lượng Role ID truyền vào
      if (targetRoles.length !== roleIds.length) {
        // Tìm các ID không tồn tại
        const foundIds = targetRoles.map((r) => r.id);
        const missingIds = roleIds.filter((id) => !foundIds.includes(id));

        res.pushError({
          key: 'roles',
          value: `Các Role ID [${missingIds.join(', ')}] không tồn tại.`,
        });
        // Dừng lại và trả về nếu có lỗi Role
        if (res.errors.length > 0) {
          return res;
        }
      }
    }

    // 3. === THỰC THI TẠO USER ===
    const hashedPassword = await bcrypt.hash(password, 10);
    const connectRoles = roleIds.map((id) => ({ id }));

    const userData: Prisma.UserCreateInput = {
      ...userCoreData,
      password: hashedPassword,
      dob: new Date(userCoreData.dob),
      updatedAt: new Date(),
      roles: {
        connect: connectRoles,
      },
    };

    try {
      const newUser = await this.userRepository.create(userData);

      // 7. Loại bỏ mật khẩu trước khi trả về
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _, ...userWithoutPassword } = newUser;
      res.user = userWithoutPassword;
    } catch (error) {
      // 🚨 Xử lý các lỗi DB khác (ví dụ: Unique Constraint Failures bị sót)
      // Đây là fallback cho các trường hợp không mong muốn
      console.error('Lỗi khi tạo User:', error);
      res.pushError({
        key: 'global',
        value: 'Lỗi không mong muốn trong quá trình tạo tài khoản.',
      });
    }

    return res;
  }

  async findAll(): Promise<UserDto[]> {
    return this.userRepository.findAll();
  }

  async findById(id: number): Promise<ResponseUserDto> {
    const res = new ResponseUserDto();

    // 1. Tìm User kèm Roles
    const user = await this.userRepository.findById(id);

    if (!user) {
      res.pushError({
        key: 'id',
        value: `User với ID ${id} không tồn tại.`,
      });
      return res;
    }

    const { password, ...result } = user;

    // 2. Gọi API lấy permission song song
    const permissionPromises = user.roles.map((role) =>
      this.roleRepository.getAggregatedPermissions(role.id),
    );

    // results sẽ là mảng các mảng: [[PermA, PermB], [PermB, PermC]]
    const results = await Promise.all(permissionPromises);
    console.log(results);
    
    // --- SỬA ĐỔI TẠI ĐÂY: Dùng Map thay vì Set ---
    const permMap = new Map<number, PermissionDto>();
    
    results.forEach((rolePerms) => {
      // rolePerms có thể là null/undefined nếu repo trả về không chuẩn
      if (rolePerms && Array.isArray(rolePerms)) {
        rolePerms.forEach((perm) => {
          // Dùng ID làm key. Nếu ID đã tồn tại, nó sẽ tự động handle (hoặc ghi đè)
          // Điều này đảm bảo mỗi ID chỉ xuất hiện 1 lần
          if (!permMap.has(perm.id)) {
            permMap.set(perm.id, perm);
          }
        });
      }
    });

    // Gán dữ liệu
    res.user = result as any;
    if (res.user) {
      // Chuyển values của Map thành Array và map sang format mong muốn
      res.user.permissions = Array.from(permMap.values()).map((perm) => ({
        id: perm.id,
        name: perm.name,
        description: perm.description ?? null,
      }));
    }

    return res;
  }

  async update(
    id: number,
    updateUserDto: UpdateUserDto,
  ): Promise<ResponseUserDto> {
    const {
      roles: newRoleIds,
      password: newPassword,
      ...userCoreData
    } = updateUserDto;
    const res = new ResponseUserDto();

    // 1. === KIỂM TRA USER TỒN TẠI ===
    const existingUser = await this.userRepository.findById(id);
    if (!existingUser) {
      res.pushError({ key: 'id', value: `User ID ${id} không tồn tại.` });
      return res;
    }

    // 2. === KIỂM TRA LỖI TRÙNG LẶP @unique ===
    // Kiểm tra trùng lặp cho các trường @unique (email, username, pID) ngoại trừ chính User đang cập nhật

    // Check Email
    if (userCoreData.email) {
      const existing = await this.userRepository.findByEmail(
        userCoreData.email,
      );
      if (existing && existing.id !== id) {
        res.pushError({
          key: 'email',
          value: 'Email đã được sử dụng bởi User khác.',
        });
      }
    }

    // Check Username (Giả định có hàm findByUsername trong UserRepository)
    if (userCoreData.username) {
      const existing = await this.userRepository.findByUsername(
        userCoreData.username,
      );
      if (existing && existing.id !== id) {
        res.pushError({
          key: 'username',
          value: 'Username đã được sử dụng bởi User khác.',
        });
      }
    }

    // Check pID (Giả định có hàm findByPID trong UserRepository)
    if (userCoreData.pID) {
      const existing = await this.userRepository.findByPID(userCoreData.pID);
      if (existing && existing.id !== id) {
        res.pushError({
          key: 'pID',
          value: 'Mã định danh pID đã được sử dụng bởi User khác.',
        });
      }
    }

    // 2b. === KIỂM TRA ROLE ID MỚI CÓ TỒN TẠI KHÔNG ===
    if (newRoleIds && newRoleIds.length > 0) {
      const targetRoles = await this.prisma.role.findMany({
        where: { id: { in: newRoleIds } },
        select: { id: true },
      });

      if (targetRoles.length !== newRoleIds.length) {
        const foundIds = targetRoles.map((r) => r.id);
        const missingIds = newRoleIds.filter((id) => !foundIds.includes(id));

        res.pushError({
          key: 'roles',
          value: `Các Role ID [${missingIds.join(', ')}] không tồn tại.`,
        });
      }
    }

    if (res.errors.length > 0) {
      return res; // Dừng nếu có lỗi validation
    }

    // 3. === CHUẨN BỊ DỮ LIỆU CẬP NHẬT USER CỐT LÕI ===
    const updateData: Prisma.UserUpdateInput = {
      ...userCoreData,
      updatedAt: new Date(),
    };

    // Mã hóa mật khẩu mới nếu có
    if (newPassword) {
      updateData.password = await bcrypt.hash(newPassword, 10);
    }
    // Xử lý DateString nếu có
    if (userCoreData.dob) {
      updateData.dob = new Date(userCoreData.dob);
    }

    let updatedUser: any;

    // 4. === THỰC HIỆN TRANSACTION (UPDATE User & Role) ===
    try {
      updatedUser = await this.prisma.$transaction(async (tx) => {
        // a) Cập nhật thông tin cốt lõi của User
        const user = await tx.user.update({
          where: { id },
          data: updateData,
          include: { roles: true }, // Include roles để lấy thông tin Roles hiện tại
        });

        // b) XỬ LÝ ROLES (Nếu có newRoleIds trong DTO)
        if (newRoleIds) {
          // Lấy tất cả Role ID hiện tại của User
          const currentRoleIds = user.roles.map((r) => r.id);

          // Role cần thêm: Role mới mà User chưa có
          const rolesToConnect = newRoleIds.filter(
            (id) => !currentRoleIds.includes(id),
          );
          // Role cần xóa: Role hiện tại mà không có trong danh sách mới
          const rolesToDisconnect = currentRoleIds.filter(
            (id) => !newRoleIds.includes(id),
          );

          // Thực hiện kết nối và ngắt kết nối
          await tx.user.update({
            where: { id },
            data: {
              roles: {
                connect: rolesToConnect.map((id) => ({ id })),
                disconnect: rolesToDisconnect.map((id) => ({ id })),
              },
            },
          });
        }

        // Trả về User đã được cập nhật hoàn chỉnh (với Roles mới)
        return tx.user.findUnique({
          where: { id },
          include: { roles: true },
        });
      });

      // 5. Trả về kết quả thành công
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _, ...userWithoutPassword } = updatedUser;
      res.user = userWithoutPassword as any;
    } catch (error) {
      // 🚨 Bắt lỗi Prisma/DB (dù đã check, đây là lưới bắt cuối)
      console.error('Lỗi khi cập nhật User:', error);
      res.pushError({
        key: 'global',
        value: 'Lỗi không mong muốn trong quá trình cập nhật tài khoản.',
      });
    }

    return res;
  }

  // // 5. DELETE
  async delete(id: number): Promise<ResponseUserDto> {
    const res = new ResponseUserDto();

    // 1. === KIỂM TRA TỒN TẠI TRƯỚC KHI XÓA ===
    const userToDelete = await this.userRepository.findById(id);

    if (!userToDelete) {
      // Nếu không tìm thấy, thêm lỗi vào ResponseUserDto
      res.pushError({
        key: 'id',
        value: `User với ID ${id} không tồn tại.`,
      });
      // Trả về response có lỗi
      return res;
    }

    // 2. === THỰC HIỆN XÓA ===
    try {
      const deletedUser = await this.userRepository.delete(id);

      // 3. === LOẠI BỎ PASSWORD VÀ GÁN VÀO RESPONSE ===
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...result } = deletedUser;

      // Gán User đã xóa vào trường user của DTO
      res.user = result as any;
    } catch (error) {
      // Bắt các lỗi DB không mong muốn trong quá trình xóa (ví dụ: lỗi khóa ngoại)
      console.error('Lỗi khi xóa User:', error);
      res.pushError({
        key: 'global',
        value: 'Lỗi không mong muốn trong quá trình xóa tài khoản.',
      });
    }

    // Trả về response thành công hoặc response có lỗi (nếu xảy ra lỗi DB)
    return res;
  }
}
