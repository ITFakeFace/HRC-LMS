import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

// Dữ liệu mẫu
const rolesData = [
  { fullname: 'SUPER_ADMINISTRATOR', shortname: 'SUPER_ADMIN' },
  { fullname: 'TEACHER', shortname: 'TEACHER' },
  { fullname: 'CUSTOMER', shortname: 'CUSTOMER' },
];

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

export const seedAccounts = async (prisma: PrismaClient) => {
  console.log('--- SEEDING ACCOUNTS ---');

  // 1. SEED ROLES
  console.log('1. Seeding Roles...');
  await Promise.all(
    rolesData.map(async (role) => {
      await prisma.role.upsert({
        where: { shortname: role.shortname },
        update: {},
        create: role,
      });
    }),
  );
  console.log(`\t[✔] Roles seeded.`);

  // 2. SEED PERMISSIONS
  console.log('2. Seeding Permissions...');
  await Promise.all(
    permissionsData.map(async (permission) => {
      await prisma.permission.upsert({
        where: { name: permission.name },
        update: {},
        create: permission,
      });
    }),
  );
  console.log(`\t[✔] Permissions seeded.`);

  // 3. ASSIGN PERMISSIONS TO SUPER_ADMIN
  console.log('3. Assigning Permissions to SUPER_ADMIN...');
  const allPermissions = await prisma.permission.findMany({ select: { id: true } });
  const permissionIds = allPermissions.map((p) => ({ id: p.id }));

  await prisma.role.update({
    where: { shortname: 'SUPER_ADMIN' },
    data: { permissions: { set: permissionIds } },
  });
  console.log(`\t[✔] Assigned all permissions to SUPER_ADMIN.`);

  // 4. SEED SUPER ADMIN USER
  console.log('4. Seeding SUPER_ADMIN User...');
  const superAdminRole = await prisma.role.findUnique({ where: { shortname: 'SUPER_ADMIN' } });
  
  if (superAdminRole) {
    const adminPassword = process.env.ADMIN_PASSWORD || 'ChangeMe123@';
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    const superAdminEmail = 'super.admin@yourdomain.com';

    await prisma.user.upsert({
      where: { email: superAdminEmail },
      update: {
        password: hashedPassword,
        roles: { set: [{ id: superAdminRole.id }] },
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
        roles: { connect: [{ id: superAdminRole.id }] },
      },
    });
    console.log(`\t[✔] Admin user created: ${superAdminEmail}`);
  }
};