import { Prisma } from '@prisma/client';

const roleWithFullRelations = Prisma.validator<Prisma.RoleDefaultArgs>()({
  include: {
    users: true,
    permissions: true,
    childRoles: {
      include: {
        child: true,
      },
    },
    parentRoles: {
      include: {
        parent: true,
      },
    },
  },
});
export type RoleFullModel = Prisma.RoleGetPayload<typeof roleWithFullRelations>;
