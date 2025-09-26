import {NextRequest, NextResponse} from "next/server";
import {CategoryService} from "@/services/CategoryService";
import {ResponseModel} from "@/models/ResponseModel";
import {authorizeRequest} from "@/lib/authorize";

const service = new CategoryService();

// -----------------------------
// GET: Lấy tất cả category
// -----------------------------
async function getCategories(req: NextRequest) {
    try {
        const categories = await service.getAllCategories();
        return NextResponse.json(
            ResponseModel.success({
                message: "Thành công!",
                statusCode: 200,
                data: categories,
            }),
            {status: 200}
        );
    } catch (err) {
        console.error("GET /categories error:", err);
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
// POST: Tạo mới category
// -----------------------------
async function createCategory(req: NextRequest) {
    try {
        const body = await req.json();
        const {category, errors} = await service.createCategory(body);

        if (errors.length > 0) {
            return NextResponse.json(
                ResponseModel.error({
                    message: "Validation failed",
                    statusCode: 400,
                    data: errors,
                }),
                {status: 400}
            );
        }

        return NextResponse.json(
            ResponseModel.success({
                message: "Thành công!",
                data: category,
            }),
            {status: 201}
        );
    } catch (err) {
        console.error("POST /categories error:", err);
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
// PUT: Cập nhật category theo id
// -----------------------------
async function updateCategory(req: NextRequest) {
    try {
        const body = await req.json();
        const {category, errors} = await service.updateCategory(body.id, body);

        if (errors.length > 0) {
            return NextResponse.json(
                ResponseModel.error({
                    message: "Validation failed",
                    statusCode: 400,
                    data: errors,
                }),
                {status: 400}
            );
        }

        return NextResponse.json(
            ResponseModel.success({
                message: "Thành công!",
                data: category,
            }),
            {status: 200}
        );
    } catch (err) {
        console.error("PUT /categories error:", err);
        return NextResponse.json(
            ResponseModel.error({
                message: (err as Error).message || "Internal Server Error",
                statusCode: 500,
                data: err,
            }),
            {status: 500}
        );
    }
}

// -----------------------------
// DELETE: Xoá category theo id
// -----------------------------
async function deleteCategory(req: NextRequest) {
    try {
        const body = await req.json();
        const {category, errors} = await service.deleteCategory(Number(body.id));

        if (errors.length > 0) {
            return NextResponse.json(
                ResponseModel.error({
                    message: "Không tìm thấy category",
                    statusCode: 404,
                    data: errors,
                }),
                {status: 404}
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
        console.error("DELETE /categories error:", err);
        return NextResponse.json(
            ResponseModel.error({
                message: (err as Error).message || "Internal Server Error",
                statusCode: 500,
                data: err,
            }),
            {status: 500}
        );
    }
}

export const GET = authorizeRequest(getCategories, "MANAGE_CATEGORIES");
export const POST = authorizeRequest(createCategory, "MANAGE_CATEGORIES");
export const PUT = authorizeRequest(updateCategory, "MANAGE_CATEGORIES");
export const DELETE = authorizeRequest(deleteCategory, "MANAGE_CATEGORIES");
