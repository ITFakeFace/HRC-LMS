import { Injectable, NotFoundException } from '@nestjs/common';
import { Permission, Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class PermissionRepository {
  constructor(private prisma: PrismaService) {}

  async findAll(): Promise<Permission[]> {
    return this.prisma.permission.findMany();
  }

  async findById(id: number): Promise<Permission | null> {
    return this.prisma.permission.findUnique({
      where: { id },
    });
  }

  async findByName(name: string): Promise<Permission | null> {
    return this.prisma.permission.findUnique({
      where: { name },
    });
  }

  async create(data: Prisma.PermissionCreateInput): Promise<Permission> {
    return this.prisma.permission.create({ data });
  }

  async update(
    id: number,
    data: Prisma.PermissionUpdateInput,
  ): Promise<Permission> {
    return this.prisma.permission.update({
      where: { id },
      data,
    });
  }

  async delete(id: number): Promise<Permission> {
    try {
      return await this.prisma.permission.delete({
        where: { id },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(`Permission with ID ${id} not exist.`);
      }
      throw error;
    }
  }
}
