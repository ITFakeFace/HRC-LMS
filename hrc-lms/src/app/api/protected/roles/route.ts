import {NextRequest, NextResponse} from "next/server";
import {RoleService} from "@/services/RoleService";
import {ResponseModel} from "@/models/ResponseModel";
import {authorizeRequest} from "@/lib/authorize";
import {RoleCreateDto} from "@/dtos/role/RoleCreateDto";

const service = new RoleService();

// -----------------------------
// GET: Lấy tất cả roles
// -----------------------------
async function getRoles(req: NextRequest) {
    try {
        const roles = await service.getAllRoles();
        return NextResponse.json(
            ResponseModel.success({
                message: "Thành công!",
                statusCode: 200,
                data: roles,
            }),
            {status: 200}
        );
    } catch (err) {
        console.error("GET /roles error:", err);
        return NextResponse.json(
            ResponseModel.error({
                message: "Internal Server Error",
                statusCode: 500,
                data: err,
            }),
            {status: 500}
        );
    }
}

// -----------------------------
// POST: Tạo role mới (Logic đã đúng với data client gửi)
// -----------------------------
async function createRole(req: NextRequest) {
    try {
        const body: RoleCreateDto = await req.json(); // Ép kiểu cho an toàn

        // Dữ liệu từ client gửi đã bao gồm fullname, shortname, parentRoles, permissions
        const {role, errors} = await service.createRole(body);

        if (errors.length > 0) {
            // Lỗi xác thực, trùng lặp, hoặc lỗi quan hệ (P2003)
            // Lấy thông báo lỗi đầu tiên hoặc tổng hợp
            const errorMessage = errors.map(e => e.message).join(', ') || "Lỗi dữ liệu không hợp lệ";

            return NextResponse.json(
                ResponseModel.error({
                    message: errorMessage,
                    statusCode: 400,
                    data: errors,
                }),
                {status: 400}
            );
        }

        return NextResponse.json(
            ResponseModel.success({
                message: "Tạo role thành công!",
                data: role,
            }),
            {status: 201}
        );
    } catch (err) {
        console.error("POST /roles error:", err);
        return NextResponse.json(
            ResponseModel.error({
                message: "Lỗi Server nội bộ",
                statusCode: 500,
                data: null,
            }),
            {status: 500}
        );
    }
}

// -----------------------------
// PUT: Cập nhật role theo id
// -----------------------------
async function updateRole(req: NextRequest) {
    try {
        const body = await req.json();
        const {role, errors} = await service.updateRole(Number(body.id), body);

        if (errors.length > 0) {
            return NextResponse.json(
                ResponseModel.error({
                    message: "Có lỗi xảy ra",
                    statusCode: 400,
                    data: errors,
                }),
                {status: 400}
            );
        }

        return NextResponse.json(
            ResponseModel.success({
                message: "Thành công!",
                data: role,
            }),
            {status: 200}
        );
    } catch (err) {
        console.error("PUT /roles error:", err);
        return NextResponse.json(
            ResponseModel.error({
                message: "Internal Server Error",
                statusCode: 500,
                data: err,
            }),
            {status: 500}
        );
    }
}

// -----------------------------
// DELETE: Xóa role theo id
// -----------------------------
async function deleteRole(req: NextRequest) {
    try {
        const body = await req.json();
        const {role, errors} = await service.deleteRole(Number(body.id));

        if (errors.length > 0) {
            return NextResponse.json(
                ResponseModel.error({
                    message: "Có lỗi xảy ra",
                    statusCode: 404,
                    data: errors,
                }),
                {status: 404}
            );
        }

        return NextResponse.json(
            ResponseModel.success({
                message: "Xoá thành công!",
                data: role,
            }),
            {status: 200}
        );
    } catch (err) {
        console.error("DELETE /roles error:", err);
        return NextResponse.json(
            ResponseModel.error({
                message: "Internal Server Error",
                statusCode: 500,
                data: err,
            }),
            {status: 500}
        );
    }
}

export const GET = authorizeRequest(getRoles, "MANAGE_ROLES");
export const POST = authorizeRequest(createRole, "MANAGE_ROLES");
export const PUT = authorizeRequest(updateRole, "MANAGE_ROLES");
export const DELETE = authorizeRequest(deleteRole, "MANAGE_ROLES");
