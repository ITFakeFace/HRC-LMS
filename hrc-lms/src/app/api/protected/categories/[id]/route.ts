import {NextRequest, NextResponse} from "next/server";
import {CategoryService} from "@/services/CategoryService";
import {ResponseModel} from "@/models/ResponseModel";
import {authorizeRequest} from "@/lib/authorize";

const service = new CategoryService();

// -----------------------------
// GET: Lấy category theo id
// -----------------------------
const getCategoryById = async (
    req: NextRequest,
    userId: string,
    params: { id: string }
) => {
    try {
        const categoryId = Number(params.id);
        const category = await service.getCategoryById(categoryId);

        if (!category) {
            return NextResponse.json(
                ResponseModel.error({
                    message: "Category not found",
                    statusCode: 404,
                    data: null,
                }),
                {status: 404}
            );
        }

        return NextResponse.json(
            ResponseModel.success({
                message: "Thành công!",
                statusCode: 200,
                data: category,
            }),
            {status: 200}
        );
    } catch (err) {
        console.error("GET /categories/[id] error:", err);
        return NextResponse.json(
            ResponseModel.error({
                message: "Internal Server Error",
                statusCode: 500,
                data: err,
            }),
            {status: 500}
        );
    }
};

// -----------------------------
// PUT: Cập nhật category theo id
// -----------------------------
const updateCategory = async (
    req: NextRequest,
    userId: string,
    params: { id: string }
) => {
    try {
        const body = await req.json();

        const {category, errors} = await service.updateCategory(
            Number(params.id),
            body
        );

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
                message: "Cập nhật thành công!",
                data: category,
            }),
            {status: 200}
        );
    } catch (err) {
        console.error("PUT /categories/[id] error:", err);
        return NextResponse.json(
            ResponseModel.error({
                message: "Internal Server Error",
                statusCode: 500,
                data: err,
            }),
            {status: 500}
        );
    }
};

// -----------------------------
// DELETE: Xóa category theo id
// -----------------------------
const deleteCategory = async (
    req: NextRequest,
    userId: string,
    params: { id: string }
) => {
    try {
        const categoryId = Number(params.id);
        const {category, errors} = await service.deleteCategory(categoryId);

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
                message: "Xoá thành công!",
                data: category,
            }),
            {status: 200}
        );
    } catch (err) {
        console.error("DELETE /categories/[id] error:", err);
        return NextResponse.json(
            ResponseModel.error({
                message: "Internal Server Error",
                statusCode: 500,
                data: err,
            }),
            {status: 500}
        );
    }
};

// -----------------------------
// Export theo chuẩn Next.js App Router
// -----------------------------
export const GET = authorizeRequest(getCategoryById, "MANAGE_CATEGORIES");
export const PUT = authorizeRequest(updateCategory, "MANAGE_CATEGORIES");
export const DELETE = authorizeRequest(deleteCategory, "MANAGE_CATEGORIES");
