// src/components/auth/PermissionGuard.tsx
"use client";

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/src/store/store";
import { useAuth } from "@/src/hooks/useAuth";

interface PermissionGuardProps {
  children: ReactNode;
  requiredRoles?: string[];
  requiredPermissions?: string[];
  requireAll?: boolean;
  fallback?: ReactNode; // Nội dung hiển thị khi không có quyền (VD: 403 Page)
  redirectTo?: string;  // Đường dẫn chuyển hướng nếu không có quyền (VD: /login)
  loadingComponent?: ReactNode; // Component hiển thị khi đang check quyền
}

export const PermissionGuard = ({
  children,
  requiredRoles = [],
  requiredPermissions = [],
  requireAll = false,
  fallback = null,
  redirectTo,
  loadingComponent = null, // Mặc định là null, nhưng nên truyền Spinner vào
}: PermissionGuardProps) => {
  const router = useRouter();
  const { isAuthenticated, status } = useSelector(
    (state: RootState) => state.auth
  );
  
  // Custom hook kiểm tra role/permission cụ thể
  const { hasRole, hasPermission } = useAuth();

  // 1. Xác định trạng thái Loading
  // CHÚ Ý: 'idle' không phải là loading. 'idle' nghĩa là chưa đăng nhập (Khách).
  // Nếu status là idle, ta coi như đã tải xong (và kết quả là không có quyền).
  const isLoading = status === "loading";

  // 2. Logic tính toán quyền hạn
  const isRoleValid =
    requiredRoles.length === 0 || hasRole(requiredRoles, requireAll);

  const isPermissionValid =
    requiredPermissions.length === 0 ||
    hasPermission(requiredPermissions, requireAll);

  // Điều kiện tiên quyết: Phải đăng nhập + Đủ Role + Đủ Permission
  const hasAccess = isAuthenticated && isRoleValid && isPermissionValid;

  // 3. Xử lý Redirect (Side Effect)
  useEffect(() => {
    // Chỉ chuyển hướng khi ĐÃ TẢI XONG và KHÔNG CÓ QUYỀN
    if (!isLoading && !hasAccess && redirectTo) {
      router.replace(redirectTo);
    }
  }, [isLoading, hasAccess, redirectTo, router]);

  // 4. LOGIC RENDER UI

  // TH1: Đang tải -> Hiện Spinner hoặc null
  if (isLoading) {
    return <>{loadingComponent}</>;
  }

  // TH2: Đã tải xong nhưng KHÔNG CÓ QUYỀN
  if (!hasAccess) {
    // Nếu có redirectTo, trả về null để đợi useEffect chuyển trang (tránh hiện fallback 1 giây rồi mới chuyển)
    if (redirectTo) return null;
    
    // Nếu không redirect, hiện thông báo lỗi (fallback)
    return <>{fallback}</>;
  }

  // TH3: CÓ QUYỀN -> Hiện nội dung bảo vệ
  return <>{children}</>;
};