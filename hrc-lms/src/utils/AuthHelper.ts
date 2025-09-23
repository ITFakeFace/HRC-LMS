export class AuthHelper {
    /**
     * Kiểm tra user có ít nhất 1 role trong danh sách requiredRoles không
     * @param userRoles danh sách role của user
     * @param requiredRoles danh sách role yêu cầu
     */
    static hasRole(userRoles: string[] = [], requiredRoles: string[] = []): boolean {
        const userLower = userRoles.map(r => r.toLowerCase());
        return requiredRoles.some(r => userLower.includes(r.toLowerCase()));
    }

    /**
     * Kiểm tra user có đầy đủ toàn bộ permissions trong danh sách requiredPermissions không
     * @param userPermissions danh sách permission của user
     * @param requiredPermissions danh sách permission yêu cầu
     */
    static hasPermissions(userPermissions: string[] = [], requiredPermissions: string[] = []): boolean {
        const userLower = userPermissions.map(p => p.toLowerCase());
        return requiredPermissions.every(p => userLower.includes(p.toLowerCase()));
    }
}
