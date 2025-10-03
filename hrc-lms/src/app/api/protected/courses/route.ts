// app/api/courses/route.ts
import {NextRequest, NextResponse} from "next/server";
import {authorizeRequest} from "@/lib/authorize";
import {CourseService} from "@/services/CourseService";
import {ResponseModel} from "@/models/ResponseModel";

const service = new CourseService();

// ------------------------
// Route handlers
// ------------------------

// GET: Lấy tất cả courses
async function getCourses(req: NextRequest) {
    const data = await service.getAllCourses();
    return NextResponse.json(
        ResponseModel.success({
            message: "Thành công!",
            statusCode: 200,
            data: data,
        })
    );
}

// POST: Tạo course mới
async function createCourse(req: NextRequest) {
    const body = await req.json();
    const result = await service.createCourse(body);

    return NextResponse.json(
        ResponseModel.success({
            message: result.errors.length === 0 ? "Tạo thành công!" : "Lỗi dữ liệu!",
            statusCode: result.errors.length === 0 ? 200 : 400,
            data: result,
        })
    );
}

// PUT: Cập nhật course
async function updateCourse(req: NextRequest) {
    const body = await req.json();
    const result = await service.updateCourse(body.id, body);

    return NextResponse.json(
        ResponseModel.success({
            message: result.errors.length === 0 ? "Cập nhật thành công!" : "Lỗi dữ liệu!",
            statusCode: result.errors.length === 0 ? 200 : 400,
            data: result,
        })
    );
}

// DELETE: Xóa course
async function deleteCourse(req: NextRequest) {
    const {searchParams} = new URL(req.url);
    const id = Number(searchParams.get("id"));
    const result = await service.deleteCourse(id);

    return NextResponse.json(
        ResponseModel.success({
            message: result.errors.length === 0 ? "Xóa thành công!" : "Không tìm thấy course!",
            statusCode: result.errors.length === 0 ? 200 : 404,
            data: result,
        })
    );
}

// ------------------------
// Export route handlers wrapped
// ------------------------
export const GET = authorizeRequest(getCourses, "MANAGE_COURSES");
export const POST = authorizeRequest(createCourse, "MANAGE_COURSES");
export const PUT = authorizeRequest(updateCourse, "MANAGE_COURSES");
export const DELETE = authorizeRequest(deleteCourse, "MANAGE_COURSES");
