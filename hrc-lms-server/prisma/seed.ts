// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

// Khởi tạo Prisma Client
const prisma = new PrismaClient();

// Danh sách các Role cần tạo
const rolesData = [
  { fullname: 'SUPER_ADMINISTRATOR', shortname: 'SUPER_ADMIN' },
  { fullname: 'TEACHER', shortname: 'TEACHER' },
  { fullname: 'CUSTOMER', shortname: 'CUSTOMER' },
];

// Danh sách các Permissions cần tạo
const permissionsData = [
  // User Management
  { name: 'VIEW_USERS', description: 'Xem danh sách người dùng' },
  { name: 'CREATE_USERS', description: 'Tạo người dùng mới' },
  { name: 'UPDATE_USERS', description: 'Cập nhật thông tin người dùng' },
  { name: 'DELETE_USERS', description: 'Xóa người dùng' },

  // Role Management
  { name: 'VIEW_ROLES', description: 'Xem danh sách Roles' },
  { name: 'CREATE_ROLES', description: 'Tạo Roles mới' },
  { name: 'UPDATE_ROLES', description: 'Cập nhật Roles' },
  { name: 'DELETE_ROLES', description: 'Xóa Roles' },

  // Permission Management
  { name: 'VIEW_PERMISSIONS', description: 'Xem danh sách Permissions' },
  { name: 'CREATE_PERMISSIONS', description: 'Tạo Permissions mới' },
  { name: 'UPDATE_PERMISSIONS', description: 'Cập nhật Permissions' },
  { name: 'DELETE_PERMISSIONS', description: 'Xóa Permissions' },

  // Course Management
  { name: 'VIEW_COURSES', description: 'Xem danh sách khóa học' },
  { name: 'CREATE_COURSES', description: 'Tạo khóa học mới' },
  { name: 'UPDATE_COURSES', description: 'Cập nhật khóa học' },
  { name: 'DELETE_COURSES', description: 'Xóa khóa học' },
];

async function main() {
  console.log('--- BẮT ĐẦU SEEDING DATABASE ---');

  // 1. SEED ROLES
  console.log('1. Seeding Roles...');
  await Promise.all(
    rolesData.map(async (role) => {
      await prisma.role.upsert({
        where: { shortname: role.shortname },
        update: {},
        create: role,
      });
      console.log(`\t[✔] Role '${role.shortname}' created/updated.`);
    }),
  );

  // 2. SEED PERMISSIONS (BƯỚC MỚI)
  console.log('\n2. Seeding Permissions...');
  await Promise.all(
    permissionsData.map(async (permission) => {
      await prisma.permission.upsert({
        where: { name: permission.name },
        update: {},
        create: permission,
      });
      console.log(`\t[✔] Permission '${permission.name}' created/updated.`);
    }),
  );

  // 3. GÁN PERMISSIONS CHO SUPER_ADMIN (BƯỚC MỚI)
  console.log('\n3. Assigning all Permissions to SUPER_ADMIN Role...');

  try {
    // Lấy tất cả Permissions IDs
    const allPermissions = await prisma.permission.findMany({
      select: { id: true },
    });
    const permissionIds = allPermissions.map((p) => ({ id: p.id }));

    // Cập nhật Role SUPER_ADMIN để gán tất cả Permissions
    await prisma.role.update({
      where: { shortname: 'SUPER_ADMIN' },
      data: {
        permissions: {
          set: permissionIds, // Dùng 'set' để gán lại toàn bộ danh sách
        },
      },
    });

    console.log(
      `\t[✔] ${permissionIds.length} Permissions assigned to SUPER_ADMIN.`,
    );
  } catch (error) {
    console.error(`\t[✘] Lỗi khi gán Permissions: ${(error as Error).message}`);
  }

  // 4. SEED SUPER ADMIN USER (BƯỚC CŨ ĐƯỢC CHUYỂN SỐ)
  console.log('\n4. Seeding SUPER_ADMIN User...');

  try {
    // Tìm Role SUPER_ADMIN vừa tạo
    const superAdminRole = await prisma.role.findUnique({
      where: { shortname: 'SUPER_ADMIN' },
      select: { id: true },
    });

    if (!superAdminRole) {
      throw new Error(
        'Không tìm thấy Role SUPER_ADMIN. Đảm bảo Role đã được seed ở bước 1.',
      );
    }

    const adminPassword = process.env.ADMIN_PASSWORD || 'ChangeMe123@';
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    const superAdminEmail = 'super.admin@yourdomain.com';

    // Tạo hoặc cập nhật tài khoản SUPER_ADMIN
    const adminUser = await prisma.user.upsert({
      where: { email: superAdminEmail },
      update: {
        password: hashedPassword,
        updatedAt: new Date(),
        // Gán Role SUPER_ADMIN
        roles: {
          set: [{ id: superAdminRole.id }],
        },
      },
      create: {
        pID: 'ADMIN0000001',
        username: 'superadmin',
        email: superAdminEmail,
        password: hashedPassword,
        fullname: 'Quản trị viên Tối cao',
        gender: false,
        dob: new Date('1990-01-01T00:00:00Z'),
        isEmailVerified: true,
        updatedAt: new Date(),
        // Gán Role SUPER_ADMIN
        roles: {
          connect: [{ id: superAdminRole.id }],
        },
      },
    });

    console.log(`\t[✔] SUPER_ADMIN user created/updated: ${adminUser.email}`);
    console.log(`\t[!] Mật khẩu Admin (mặc định): ${adminPassword}`);
  } catch (error) {
    console.error(`\t[✘] Lỗi khi tạo Admin User: ${(error as Error).message}`);
  }

  console.log('\n--- KẾT THÚC SEEDING ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
