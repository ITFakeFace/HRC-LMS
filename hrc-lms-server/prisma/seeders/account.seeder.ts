import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

// =============================================================================
// DATA DEFINITION
// =============================================================================

const rolesData = [
  { fullname: 'SUPER_ADMINISTRATOR', shortname: 'SUPER_ADMIN' },
  { fullname: 'TEACHER', shortname: 'TEACHER' },
  { fullname: 'STUDENT', shortname: 'STUDENT' },
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

const teachersData = [
  {
    pID: 'GV001',
    username: 'teacher1',
    email: 'teacher1@hrc.com',
    phone: '0901111111',
    fullname: 'Nguyễn Thầy A',
    gender: true, // Nam
    dob: new Date('1985-05-15'),
  },
  {
    pID: 'GV002',
    username: 'teacher2',
    email: 'teacher2@hrc.com',
    phone: '0901111112',
    fullname: 'Trần Cô B',
    gender: false, // Nữ
    dob: new Date('1990-10-20'),
  },
];

const studentsData = [
  {
    pID: 'HV001',
    username: 'student1',
    email: 'student1@hrc.com',
    phone: '0902222221',
    fullname: 'Lê Học Trò 1',
    gender: true, // Nam
    dob: new Date('2003-01-01'),
  },
  {
    pID: 'HV002',
    username: 'student2',
    email: 'student2@hrc.com',
    phone: '0902222222',
    fullname: 'Phạm Học Trò 2',
    gender: false, // Nữ
    dob: new Date('2003-06-15'),
  },
  {
    pID: 'HV003',
    username: 'student3',
    email: 'student3@hrc.com',
    phone: '0902222223',
    fullname: 'Hoàng Học Trò 3',
    gender: true, // Nam
    dob: new Date('2004-12-25'),
  },
];

// =============================================================================
// MAIN SEEDER FUNCTION
// =============================================================================

export const seedAccounts = async (prisma: PrismaClient) => {
  console.log('--- SEEDING ACCOUNTS ---');

  // Chuẩn bị Password chung cho User thường (Teacher/Student)
  const commonPassword = '123456';
  const hashedCommonPassword = await bcrypt.hash(commonPassword, 10);

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

  // 5. SEED TEACHERS
  console.log('5. Seeding Teachers...');
  const teacherRole = await prisma.role.findUnique({ where: { shortname: 'TEACHER' } });
  
  if (teacherRole) {
    for (const t of teachersData) {
      await prisma.user.upsert({
        where: { username: t.username }, // Check trùng username
        update: {
          // Update thông tin nếu muốn, hoặc để trống
          roles: { connect: { id: teacherRole.id } },
        },
        create: {
          pID: t.pID,
          username: t.username,
          email: t.email,
          phone: t.phone,
          password: hashedCommonPassword,
          fullname: t.fullname,
          gender: t.gender,
          dob: t.dob,
          isEmailVerified: true,
          roles: {
            connect: { id: teacherRole.id },
          },
        },
      });
    }
    console.log(`\t[✔] Seeded ${teachersData.length} teachers.`);
  } else {
    console.warn(`\t[!] Role TEACHER not found.`);
  }

  // 6. SEED STUDENTS
  console.log('6. Seeding Students...');
  const studentRole = await prisma.role.findUnique({ where: { shortname: 'STUDENT' } });

  if (studentRole) {
    for (const s of studentsData) {
      await prisma.user.upsert({
        where: { username: s.username },
        update: {
          roles: { connect: { id: studentRole.id } },
        },
        create: {
          pID: s.pID,
          username: s.username,
          email: s.email,
          phone: s.phone,
          password: hashedCommonPassword,
          fullname: s.fullname,
          gender: s.gender,
          dob: s.dob,
          isEmailVerified: true,
          roles: {
            connect: { id: studentRole.id },
          },
        },
      });
    }
    console.log(`\t[✔] Seeded ${studentsData.length} students.`);
  } else {
    console.warn(`\t[!] Role STUDENT not found.`);
  }
};