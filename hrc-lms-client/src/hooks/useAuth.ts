// src/hooks/useAuth.ts
import { useSelector } from "react-redux";
import { useMemo } from "react";
import { RootState } from "../store/store";

export const useAuth = () => {
  const auth = useSelector((state: RootState) => state.auth);

  // Cập nhật hàm hasRole: thêm tham số requireAll
  const hasRole = useMemo(
    () =>
      (requiredRoles: string[], requireAllRoles: boolean = false) => {
        if (!auth.roles || auth.roles.length === 0) return false;

        if (requireAllRoles) {
          // Strict Mode: Phải có TẤT CẢ role trong danh sách
          return requiredRoles.every((role) => auth.roles.includes(role));
        }
        // Default: Chỉ cần có 1 trong các role
        return requiredRoles.some((role) => auth.roles.includes(role));
      },
    [auth.roles]
  );

  // Cập nhật hàm hasPermission: thêm tham số requireAll
  const hasPermission = useMemo(
    () =>
      (
        requiredPermissions: string[],
        requireAllPermissions: boolean = false
      ) => {
        if (!auth.permissions || auth.permissions.length === 0) return false;

        if (requireAllPermissions) {
          // Strict Mode: Phải có TẤT CẢ permission
          return requiredPermissions.every((perm) =>
            auth.permissions.includes(perm)
          );
        }
        // Default: Chỉ cần 1 permission
        return requiredPermissions.some((perm) =>
          auth.permissions.includes(perm)
        );
      },
    [auth.permissions]
  );

  return { ...auth, hasRole, hasPermission };
};
