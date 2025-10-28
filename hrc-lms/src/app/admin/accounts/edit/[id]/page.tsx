"use client";
import {InputText} from 'primereact/inputtext';
import {Password} from 'primereact/password';
import {Dropdown} from 'primereact/dropdown';
import {Calendar} from 'primereact/calendar';
import {FileUpload} from 'primereact/fileupload';
import {Button} from 'primereact/button';
import {Card} from 'primereact/card';
import {Divider} from 'primereact/divider';
import {Checkbox} from 'primereact/checkbox';
import 'primereact/resources/themes/saga-blue/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import * as Yup from "yup";
import React, {useEffect, useState} from "react";
import {Controller, SubmitHandler, useForm} from "react-hook-form";
import {yupResolver} from '@hookform/resolvers/yup';
import APIClient from "@/lib/api"; // Giả định đường dẫn này là đúng
import {ResponseModel} from "@/models/ResponseModel"; // Giả định đường dẫn này là đúng
import {useRouter} from "next/navigation";
import {MultiSelect} from "primereact/multiselect";

// --- Kiểu dữ liệu cho API trả về ---
interface UserRole {
    userId: number;
    roleId: number;
    role: {
        id: number;
        fullname: string;
        shortname: string;
    };
}

interface UserData {
    id: number;
    pID: string;
    username: string;
    phone: string | null;
    email: string;
    password: string;
    avatar: string | null;
    fullname: string;
    gender: boolean;
    dob: string;
    lockoutEnd: string | null;
    isEmailVerified: boolean;
    createdAt: string;
    updatedAt: string;
    userRoles: UserRole[];
}

// --- Kiểu dữ liệu cho Form ---
interface IUserForm {
    pID: string;
    username: string;
    phone: string | null;
    email: string;
    password?: string; // Mật khẩu là OPTIONAL khi chỉnh sửa
    avatar: File | null;
    fullname: string;
    gender: boolean;
    dob: Date | null;
    lockoutEnd: Date | null;
    isEmailVerified: boolean;
    roles: Array<number>;
}

// --- Định nghĩa Schema Yup (giữ nguyên) ---
const schema = Yup.object({
    pID: Yup.string().required('PID là bắt buộc').max(12, 'PID không được vượt quá 12 ký tự'),
    username: Yup.string().required('Username là bắt buộc').max(50, 'Tối đa 50 ký tự'),
    email: Yup.string().required('Email là bắt buộc').email('Email không đúng định dạng').max(100, 'Tối đa 100 ký tự'),
    // Password là optional khi update
    password: Yup.string().min(6, 'Ít nhất 6 ký tự').optional().transform((value, originalValue) =>
        originalValue === "" ? undefined : value
    ),
    fullname: Yup.string().required('Họ tên là bắt buộc').max(100, 'Tối đa 100 ký tự'),
    phone: Yup.string().nullable().matches(/^\d{10}$/, 'Số điện thoại phải có đúng 10 số').optional(),
    dob: Yup.date().required('Ngày sinh là bắt buộc'),
    gender: Yup.boolean().required(),
    isEmailVerified: Yup.boolean(),
    avatar: Yup.mixed().nullable(),
    lockoutEnd: Yup.date().nullable(),
    roles: Yup.array().nullable(),
});

// --- Component Chính ---
// Sửa prop name để rõ ràng hơn và giữ type cho component
const UserEditForm = ({params}: { params: { id: string } }) => {
    const userId = Number(React.use(params).id);
    const router = useRouter();
    const [roles, setRoles] = useState<any[]>([]);
    const [currentAvatarUrl, setCurrentAvatarUrl] = useState<string | null>(null);

    const emptyUser: IUserForm = {
        pID: '',
        username: '',
        phone: null,
        email: '',
        password: '',
        avatar: null,
        fullname: '',
        gender: true,
        dob: null,
        lockoutEnd: null,
        isEmailVerified: false,
        roles: [],
    };

    const {
        register,
        handleSubmit,
        setValue,
        control,
        watch,
        reset,
        setError,
        formState: {errors, isSubmitting}
    } = useForm<IUserForm>({
        resolver: yupResolver(schema),
        defaultValues: emptyUser,
    });

    // --- Fetch Roles (Giữ nguyên) ---
    const fetchRoles = async () => {
        try {
            const res: ResponseModel = await APIClient.get("/api/protected/roles");
            if (res.status === true) {
                setRoles(res.data);
            } else {
                console.error("Lỗi khi lấy danh sách vai trò:", res);
            }
        } catch (error) {
            console.error("Lỗi fetchRoles:", error);
        }
    }

    // --- Fetch User Data (Giữ nguyên) ---
    const fetchUser = async (id: number) => {
        try {
            const res: ResponseModel = await APIClient.get(`/api/protected/users/${id}`);
            if (res.status === true && res.data) {
                const userData: UserData = res.data;

                const initialData: IUserForm = {
                    pID: userData.pID,
                    username: userData.username,
                    phone: userData.phone,
                    email: userData.email,
                    password: '',
                    avatar: null,
                    fullname: userData.fullname,
                    gender: userData.gender,
                    dob: userData.dob ? new Date(userData.dob) : null,
                    lockoutEnd: userData.lockoutEnd ? new Date(userData.lockoutEnd) : null,
                    isEmailVerified: userData.isEmailVerified,
                    roles: userData.userRoles.map(ur => ur.roleId),
                };

                reset(initialData);
                setCurrentAvatarUrl(userData.avatar);
            } else {
                console.error("Không tìm thấy người dùng hoặc lỗi API:", res);
            }
        } catch (error) {
            console.error("Lỗi fetchUser:", error);
        }
    }

    const genderOptions = [
        {label: 'Nam', value: true},
        {label: 'Nữ', value: false}
    ];

    // --- Submit Handler (Update) ---
    const onSubmit: SubmitHandler<IUserForm> = async (formData) => {
        try {
            const form = new FormData();

            // Xóa password khỏi form data nếu nó rỗng
            const dataToSubmit = {...formData};
            if (!dataToSubmit.password) {
                delete dataToSubmit.password;
            }

            Object.entries(dataToSubmit).forEach(([key, value]) => {
                if (key === "avatar") {
                    if (value instanceof File) {
                        form.append("avatar", value);
                    } else if (value === null && currentAvatarUrl) {
                        // Nếu người dùng xóa ảnh cũ (null) và có ảnh cũ (currentAvatarUrl),
                        // gửi tín hiệu xóa. Giả định backend nhận chuỗi "null" để xóa.
                        form.append("avatar", 'null');
                    }
                    // Nếu value là null và không có ảnh cũ, không append gì (giữ nguyên).
                } else if (key === "roles" && Array.isArray(value)) {
                    // Cập nhật: Append mảng roles dưới dạng chuỗi JSON
                    // để Route Handler có thể parse dễ dàng.
                    const roleObjects = value.map(id => ({id: id}));
                    form.append("roles", JSON.stringify(roleObjects));

                } else if (key === "dob" || key === "lockoutEnd") {
                    // Xử lý Date/Date/null
                    if (value instanceof Date) {
                        form.append(key, value.toISOString());
                    } else if (value === null) {
                        // Gửi chuỗi rỗng để backend hiểu là NULL (đã chuẩn hóa trong Route Handler)
                        form.append(key, "");
                    }
                } else if (key === "phone" && value === null) {
                    // Xử lý trường phone nullable/optional
                    form.append(key, "");
                } else if (value !== undefined && value !== null) {
                    // Các trường còn lại (string, boolean, number)
                    form.append(key, value.toString());
                }
            });

            console.log("Dữ liệu gửi đi:", dataToSubmit);

            // Sử dụng APIClient.put và truyền userId
            const res: ResponseModel = await APIClient.put(`/api/protected/users/${userId}`, form, {
                headers: {"Content-Type": "multipart/form-data"} // Axios/Fetch thường tự xử lý
            });

            if (res.status === true) {
                alert("Cập nhật người dùng thành công!");
                router.push('/users');
            } else {
                console.error("Lỗi cập nhật API:", res);
                alert(`Lỗi cập nhật: ${res.message}`);
            }

        } catch (error) {
            console.error("Lỗi onSubmit:", error);
            alert("Đã xảy ra lỗi trong quá trình cập nhật.");
        }
    };

    // --- useEffect để tải dữ liệu (Giữ nguyên) ---
    useEffect(() => {
        fetchRoles();
        if (userId) {
            fetchUser(userId);
        }
    }, [userId])

    return (
        <div className="p-4 max-w-4xl mx-auto">
            <Card title={`Chỉnh Sửa Người Dùng ID: ${userId}`} className="shadow-lg">
                <form className="p-fluid" onSubmit={handleSubmit(onSubmit)}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                        {/* PID */}
                        <div className="field">
                            <label htmlFor="pID" className="block text-sm font-medium mb-2">
                                PID <span className="text-red-500">*</span>
                            </label>
                            <InputText
                                id="pID"
                                {...register('pID')}
                                placeholder="Nhập PID (tối đa 12 ký tự)"
                                className={errors.pID ? 'p-invalid' : ''}
                            />
                            {errors.pID && <small className="p-error">{errors.pID.message}</small>}
                        </div>

                        {/* Username */}
                        <div className="field">
                            <label htmlFor="username" className="block text-sm font-medium mb-2">
                                Username <span className="text-red-500">*</span>
                            </label>
                            <InputText
                                id="username"
                                {...register('username')}
                                placeholder="Nhập username (tối đa 50 ký tự)"
                                className={errors.username ? 'p-invalid' : ''}
                            />
                            {errors.username && <small className="p-error">{errors.username.message}</small>}
                        </div>

                        {/* Email */}
                        <div className="field">
                            <label htmlFor="email" className="block text-sm font-medium mb-2">
                                Email <span className="text-red-500">*</span>
                            </label>
                            <InputText
                                id="email"
                                type="email"
                                {...register('email')}
                                placeholder="Nhập email (tối đa 100 ký tự)"
                                className={errors.email ? 'p-invalid' : ''}
                            />
                            {errors.email && <small className="p-error">{errors.email.message}</small>}
                        </div>

                        {/* Phone */}
                        <div className="field">
                            <label htmlFor="phone" className="block text-sm font-medium mb-2">
                                Số điện thoại
                            </label>
                            <InputText
                                id="phone"
                                {...register('phone')}
                                placeholder="Nhập số điện thoại (10 số)"
                                maxLength={10}
                                className={errors.phone ? 'p-invalid' : ''}
                            />
                            {errors.phone && <small className="p-error">{errors.phone.message}</small>}
                        </div>

                        {/* Password - Ghi chú: Bỏ qua nếu để trống */}
                        <div className="field">
                            <label htmlFor="password" className="block text-sm font-medium mb-2">
                                Mật khẩu (Bỏ qua nếu không muốn thay đổi)
                            </label>
                            <Controller
                                name="password"
                                control={control}
                                render={({field}) => (
                                    <Password
                                        id="password"
                                        value={field.value}
                                        onChange={(e) => field.onChange(e.target.value)}
                                        placeholder="Nhập mật khẩu mới (Ít nhất 6 ký tự)"
                                        toggleMask
                                        feedback={false}
                                        className={errors.password ? 'p-invalid' : ''}
                                    />
                                )}
                            />
                            {errors.password && <small className="p-error">{errors.password.message}</small>}
                        </div>

                        {/* Full name */}
                        <div className="field">
                            <label htmlFor="fullname" className="block text-sm font-medium mb-2">
                                Họ và tên <span className="text-red-500">*</span>
                            </label>
                            <InputText
                                id="fullname"
                                {...register('fullname')}
                                placeholder="Nhập họ và tên (tối đa 100 ký tự)"
                                className={errors.fullname ? 'p-invalid' : ''}
                            />
                            {errors.fullname && <small className="p-error">{errors.fullname.message}</small>}
                        </div>

                        {/* Gender */}
                        <div className="field">
                            <label htmlFor="gender" className="block text-sm font-medium mb-2">
                                Giới tính <span className="text-red-500">*</span>
                            </label>
                            <Dropdown
                                id="gender"
                                value={watch('gender')}
                                onChange={(e) => setValue('gender', e.value)}
                                options={genderOptions}
                                optionLabel="label"
                                optionValue="value"
                                placeholder="Chọn giới tính"
                            />
                        </div>

                        {/* Date of Birth */}
                        <div className="field">
                            <label htmlFor="dob" className="block text-sm font-medium mb-2">
                                Ngày sinh <span className="text-red-500">*</span>
                            </label>
                            <Calendar
                                id="dob"
                                value={watch('dob')}
                                onChange={(e) => setValue('dob', e.value as Date)}
                                placeholder="Chọn ngày sinh"
                                dateFormat="dd/mm/yy"
                                showIcon
                                maxDate={new Date()}
                                className={errors.dob ? 'p-invalid' : ''}
                            />
                            {errors.dob && <small className="p-error">{errors.dob.message}</small>}
                        </div>

                        {/* Lockout End (Optional) */}
                        <div className="field">
                            <label htmlFor="lockoutEnd" className="block text-sm font-medium mb-2">
                                Ngày hết khóa tài khoản
                            </label>
                            <Calendar
                                id="lockoutEnd"
                                value={watch('lockoutEnd')}
                                onChange={(e) => setValue('lockoutEnd', e.value as Date)}
                                placeholder="Chọn ngày hết khóa (nếu có)"
                                dateFormat="dd/mm/yy"
                                showIcon
                                showTime
                                hourFormat="24"
                            />
                        </div>

                        {/* Roles */}
                        <div className="field">
                            <label htmlFor="roles" className="block text-sm font-medium mb-2">
                                Vị trí
                            </label>
                            <MultiSelect
                                id="roles"
                                value={watch('roles')}
                                options={roles}
                                optionLabel="fullname"
                                optionValue="id" // Giá trị cần lưu là roleId
                                onChange={(e) => setValue('roles', e.value)}
                                placeholder="Chọn vị trí"
                            />
                        </div>
                    </div>

                    <Divider/>

                    {/* Avatar Display & Upload */}
                    <div className="field">
                        <label className="block text-sm font-medium mb-2">Avatar</label>
                        {currentAvatarUrl && (
                            <div className="mb-3">
                                <span className="block text-sm text-gray-600 mb-1">Avatar hiện tại:</span>
                                <img
                                    src={currentAvatarUrl}
                                    alt="Current Avatar"
                                    className="w-20 h-20 rounded-full object-cover border-2 border-gray-300"
                                />
                            </div>
                        )}
                        <FileUpload
                            mode="basic"
                            accept="image/*"
                            maxFileSize={5000000}
                            onSelect={(e) => setValue('avatar', e.files[0])}
                            onClear={() => {
                                // Nếu xóa file upload, set value là null để backend biết xóa ảnh cũ
                                setValue('avatar', null);
                                setCurrentAvatarUrl(null); // Xóa hiển thị ảnh cũ
                            }}
                            chooseLabel="Chọn ảnh đại diện mới"
                            className="mr-2"
                        />
                        <small className="text-gray-500">Chọn file ảnh (tối đa 5MB). Nếu chọn, ảnh mới sẽ thay thế ảnh
                            cũ.</small>
                    </div>

                    {/* Email Verified Checkbox */}
                    <div className="field-checkbox mt-4">
                        <Checkbox
                            inputId="isEmailVerified"
                            checked={watch('isEmailVerified')}
                            onChange={(e) => setValue('isEmailVerified', e.checked || false)}
                        />
                        <label htmlFor="isEmailVerified" className="ml-2">
                            Email đã được xác thực
                        </label>
                    </div>

                    <Divider/>

                    {/* Submit Button */}
                    <div className="flex justify-center gap-4 mt-6">
                        <Button
                            type="button"
                            label="Quay về"
                            icon="pi pi-arrow-left"
                            className="p-button-secondary"
                            onClick={() => router.back()}
                        />
                        <Button
                            type="button"
                            label="Đặt lại"
                            icon="pi pi-refresh"
                            className="p-button-secondary"
                            onClick={() => fetchUser(userId)} // Tải lại dữ liệu gốc
                        />
                        <Button
                            type="submit"
                            label="Cập nhật người dùng"
                            icon="pi pi-save"
                            loading={isSubmitting}
                            className="p-button-success"
                        />
                    </div>
                </form>
            </Card>
        </div>
    );
};

export default UserEditForm;